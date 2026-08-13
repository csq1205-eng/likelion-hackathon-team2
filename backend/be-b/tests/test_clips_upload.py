from app.services.vision_service import VisionCriterion, VisionServiceCallError, VisionVerdict
from tests.conftest import auth_header, fake_clip_file


def _upload(client, mission_id=100, shared=True, headers=None):
    return client.post(
        "/api/clips/upload",
        data={"missionId": str(mission_id), "shared": str(shared).lower()},
        files={"clip": fake_clip_file()},
        headers=headers if headers is not None else auth_header(),
    )


def test_upload_without_authorization_returns_401(client):
    response = client.post(
        "/api/clips/upload",
        data={"missionId": "100", "shared": "true"},
        files={"clip": fake_clip_file()},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH-001"


def test_upload_pass_returns_200_with_full_envelope(client, fake_vision):
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=92.5, criteria=[], model_notes="ok"))

    response = _upload(client)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["missionId"] == 100
    assert data["attemptNo"] == 1
    assert data["frameCount"] == 4
    assert data["judgementStatus"] == "COMPLETED"
    assert data["result"] == "PASS"
    assert data["retentionPolicy"] == "KEEP_24_HOURS"
    assert data["retentionExpiresAt"] is not None
    # 첫 업로드에서는 재촬영/폴링 관련 필드가 없어야 한다 (명세서 12.1 예시).
    assert "retryCount" not in data
    assert "pollingIntervalSeconds" not in data


def test_upload_not_shared_uses_keep_until_highlight_complete(client, fake_vision):
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=92.5, criteria=[], model_notes="ok"))

    response = _upload(client, shared=False)

    data = response.json()["data"]
    assert data["retentionPolicy"] == "KEEP_UNTIL_HIGHLIGHT_COMPLETE"
    assert data["retentionExpiresAt"] is None


def test_reshoot_reports_retry_fields(client, fake_vision):
    fake_vision.queue(VisionVerdict(verdict="FAIL", confidence_score=40.0, criteria=[], model_notes="no"))
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=90.0, criteria=[], model_notes="ok"))

    first = _upload(client)
    assert first.json()["data"]["result"] == "FAIL"

    second = _upload(client)
    data = second.json()["data"]
    assert data["attemptNo"] == 2
    assert data["retryCount"] == 1
    assert data["maxRetryCount"] == 3
    assert data["remainingRetryCount"] == 2


def test_retry_exceeded_returns_mission_003(client, fake_vision):
    for _ in range(3):
        fake_vision.queue(VisionVerdict(verdict="FAIL", confidence_score=10.0, criteria=[], model_notes="no"))

    for _ in range(3):
        response = _upload(client)
        assert response.status_code == 200

    blocked = _upload(client)
    assert blocked.status_code == 429
    assert blocked.json()["code"] == "MISSION-003"


def test_daily_ai_limit_returns_mission_005(client, fake_vision, monkeypatch):
    monkeypatch.setenv("DAILY_AI_JUDGEMENT_LIMIT", "1")
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=90.0, criteria=[], model_notes="ok"))

    first = _upload(client, mission_id=200)
    assert first.status_code == 200

    second = _upload(client, mission_id=201)
    assert second.status_code == 400
    assert second.json()["code"] == "MISSION-005"


def test_network_error_returns_202_then_background_retry_completes(client, fake_vision):
    fake_vision.queue_error(VisionServiceCallError("timeout"))
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=88.0, criteria=[], model_notes="ok"))

    response = _upload(client)

    assert response.status_code == 202
    data = response.json()["data"]
    assert data["judgementStatus"] == "PROCESSING"
    assert data["result"] is None
    assert data["pollingIntervalSeconds"] == 3

    # TestClient는 BackgroundTasks를 응답 직후 동기적으로 실행하므로 재시도가 이미 끝나 있어야 한다.
    result = client.get(f"/api/clips/{data['clipId']}/result", headers=auth_header())
    body = result.json()["data"]
    assert body["status"] == "COMPLETED"
    assert body["result"] == "PASS"


def test_mission_title_and_criteria_are_passed_to_vision_and_reason(client, fake_vision, fake_reason_client):
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=92.5, criteria=[], model_notes="ok"))

    response = client.post(
        "/api/clips/upload",
        data={
            "missionId": "100",
            "shared": "true",
            "missionTitle": "아침 물 한 잔 마시기",
            "criteria": '[{"id": "product_visible", "description": "물컵이 보여야 함"}]',
        },
        files={"clip": fake_clip_file()},
        headers=auth_header(),
    )

    assert response.status_code == 200
    assert fake_vision.last_mission_title == "아침 물 한 잔 마시기"
    assert fake_vision.last_criteria_hint == [{"id": "product_visible", "description": "물컵이 보여야 함"}]
    assert fake_reason_client.last_mission_title == "아침 물 한 잔 마시기"


def test_retry_preserves_mission_title_and_criteria(client, fake_vision, fake_reason_client):
    fake_vision.queue_error(VisionServiceCallError("timeout"))
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=88.0, criteria=[], model_notes="ok"))

    response = client.post(
        "/api/clips/upload",
        data={
            "missionId": "100",
            "shared": "true",
            "missionTitle": "아침 물 한 잔 마시기",
            "criteria": '[{"id": "drink_water", "description": "물컵이 보여야 함"}]',
        },
        files={"clip": fake_clip_file()},
        headers=auth_header(),
    )

    assert response.status_code == 202

    # TestClient는 BackgroundTasks를 응답 직후 동기적으로 실행하므로, 이 시점엔 재시도가 이미 끝나 있다.
    assert fake_vision.last_mission_title == "아침 물 한 잔 마시기"
    assert fake_vision.last_criteria_hint == [{"id": "drink_water", "description": "물컵이 보여야 함"}]
    assert fake_reason_client.last_mission_title == "아침 물 한 잔 마시기"


def test_invalid_criteria_json_returns_common_001(client, fake_vision):
    response = client.post(
        "/api/clips/upload",
        data={"missionId": "100", "shared": "true", "criteria": "not-json"},
        files={"clip": fake_clip_file()},
        headers=auth_header(),
    )

    assert response.status_code == 400
    assert response.json()["code"] == "COMMON-001"


def test_invalid_file_extension_returns_file_001(client):
    response = client.post(
        "/api/clips/upload",
        data={"missionId": "100", "shared": "true"},
        files={"clip": ("clip.txt", b"not-a-video", "text/plain")},
        headers=auth_header(),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "FILE-001"
