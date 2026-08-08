"""
FastAPI 엔드포인트를 TestClient로 실제 HTTP 요청처럼 검증한다.
pipeline.process_clip은 목(mock)으로 대체해서 OpenAI 키/실제 영상 없이도 돈다.
(judge_mission 자체의 정확도는 여기서 검증하지 않음 -- 그건 나중에 평가셋으로 별도 검증)

실행: python3 tests/test_api.py
"""
import sys
import os
import io
import tempfile
from contextlib import contextmanager

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# storage/, clips.db 같은 상대경로가 실행 위치를 더럽히지 않도록 임시 디렉토리로 이동
os.chdir(tempfile.mkdtemp())

from fastapi.testclient import TestClient
import db
import main
from models import VerdictResponse, Criterion


def _fake_clip_bytes():
    return io.BytesIO(b"fake video bytes")  # frame_extraction은 mock되므로 진짜 영상일 필요 없음


def _pass_verdict(mission_id, mission_label, clip_id, clip_path, criteria=None):
    return VerdictResponse(
        mission_id=mission_id, clip_id=clip_id, verdict="pass", confidence=0.95,
        criteria=[Criterion(id="target_action_detected", met=True)],
        model_notes="테스트용 고정 응답", processed_at="2026-08-01T00:00:00+00:00",
    )


def _fail_verdict(mission_id, mission_label, clip_id, clip_path, criteria=None):
    return VerdictResponse(
        mission_id=mission_id, clip_id=clip_id, verdict="fail", confidence=0.4,
        criteria=[Criterion(id="target_action_detected", met=False)],
        model_notes="테스트용 고정 응답", processed_at="2026-08-01T00:00:00+00:00",
    )


def _upload(client, mission_id, mission_label="물 마시기"):
    return client.post(
        "/api/clips/upload",
        data={"mission_id": mission_id, "mission_label": mission_label},
        files={"clip": ("clip.mp4", _fake_clip_bytes(), "video/mp4")},
    )


def test_upload_success_returns_verdict(client):
    main.process_clip = _pass_verdict
    res = _upload(client, "m-api-1")
    assert res.status_code == 200, res.text
    assert res.json()["verdict"] == "pass"
    assert db.get_retry_count("m-api-1") == 0


def test_fail_verdict_increments_retry_count(client):
    main.process_clip = _fail_verdict
    res = _upload(client, "m-api-2")
    assert res.status_code == 200
    assert res.json()["verdict"] == "fail"
    assert db.get_retry_count("m-api-2") == 1


def test_exceeding_retry_limit_returns_429(client):
    main.process_clip = _fail_verdict
    mission_id = "m-api-3"
    for _ in range(main.MAX_MISSION_RETRIES):
        res = _upload(client, mission_id)
        assert res.status_code == 200

    res = _upload(client, mission_id)
    assert res.status_code == 429


def test_share_and_delete_flow(client):
    main.process_clip = _pass_verdict
    clip_id = _upload(client, "m-api-4").json()["clip_id"]

    share_res = client.patch(f"/api/clips/{clip_id}/share", json={"shared": True})
    assert share_res.status_code == 200
    assert share_res.json()["shared"] is True

    delete_res = client.delete(f"/api/clips/{clip_id}")
    assert delete_res.status_code == 200
    assert db.get_clip(clip_id)["deleted"] == 1


def test_highlight_complete_purges_non_shared_clip(client):
    main.process_clip = _pass_verdict
    clip_id = _upload(client, "m-api-5").json()["clip_id"]  # 기본값: 비공유

    # share_decided가 아직 0이면 유예되므로, 먼저 '공유 안 함'을 명시적으로 선택한다.
    client.patch(f"/api/clips/{clip_id}/share", json={"shared": False})

    res = client.post(f"/api/clips/{clip_id}/highlight-complete")
    assert res.status_code == 200
    assert res.json()["purged"] is True
    assert db.get_clip(clip_id)["deleted"] == 1


def test_highlight_complete_awaits_share_decision(client):
    main.process_clip = _pass_verdict
    clip_id = _upload(client, "m-api-5b").json()["clip_id"]  # share 미결정

    res = client.post(f"/api/clips/{clip_id}/highlight-complete")
    assert res.status_code == 200
    assert res.json()["purged"] is False
    assert res.json()["reason"] == "awaiting_share_decision"
    assert db.get_clip(clip_id)["deleted"] == 0


def test_status_endpoint_for_completed_clip(client):
    main.process_clip = _pass_verdict
    clip_id = _upload(client, "m-api-6").json()["clip_id"]

    status_res = client.get(f"/api/clips/{clip_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "completed"


def test_missing_clip_returns_404(client):
    res = client.patch("/api/clips/does-not-exist/share", json={"shared": True})
    assert res.status_code == 404


def test_upload_rejects_disallowed_file_extension(client):
    res = client.post(
        "/api/clips/upload",
        data={"mission_id": "m-api-7", "mission_label": "물 마시기"},
        files={"clip": ("clip.avi", _fake_clip_bytes(), "video/x-msvideo")},
    )
    assert res.status_code == 400
    assert res.json()["code"] == "FILE-001"


def test_upload_rejects_out_of_range_duration_without_charging_retry_count(client):
    """frame_extraction 내부에서 영상 길이가 5초 허용 범위를 벗어나 FILE-001을
    던지면(InvalidFileFormatError), main.py가 이걸 AI-001로 감싸버리지 않고
    그대로 전달해야 한다. 판정을 시도한 게 아니므로 재촬영 횟수도 차감되면 안 된다."""
    def raise_duration_error(mission_id, mission_label, clip_id, clip_path, criteria=None):
        raise main.InvalidFileFormatError(
            "미션 인증 클립은 5초 촬영만 허용합니다 (업로드된 영상: 2.00초)"
        )

    main.process_clip = raise_duration_error
    res = client.post(
        "/api/clips/upload",
        data={"mission_id": "m-api-11", "mission_label": "물 마시기"},
        files={"clip": ("clip.mp4", _fake_clip_bytes(), "video/mp4")},
    )
    assert res.status_code == 400
    assert res.json()["code"] == "FILE-001"
    assert db.get_retry_count("m-api-11") == 0


def _seed_clip_for_user(clip_id, mission_id, user_id, verdict="pass"):
    """withdrawal-cleanup 테스트용 클립을 DB+디스크에 직접 만든다.
    user_id는 이제 upload API의 파라미터가 아니므로(get_mission() 연결 전까지는
    upload로는 만들 수 없다 - main.py 참고) DB 레이어를 직접 호출해서 시드한다."""
    clip_path = os.path.join(main.UPLOAD_DIR, f"{clip_id}.mp4")
    with open(clip_path, "wb") as f:
        f.write(b"fake video bytes")
    db.create_clip_record(clip_id, mission_id, clip_path, verdict=verdict, user_id=user_id)
    return clip_path


@contextmanager
def _user_id_linking_wired():
    """get_mission()이 연결된 이후 상황을 이 블록 안에서만 흉내낸다.
    실제 기본값(mission_lookup.USER_ID_LINKING_WIRED = False)은 블록 밖에서 그대로 유지된다."""
    original = main.mission_lookup.USER_ID_LINKING_WIRED
    main.mission_lookup.USER_ID_LINKING_WIRED = True
    try:
        yield
    finally:
        main.mission_lookup.USER_ID_LINKING_WIRED = original


def test_withdrawal_cleanup_refuses_success_while_user_id_linking_unwired(client):
    """지금 실제 배포 상태(USER_ID_LINKING_WIRED = False, 기본값)를 검증한다.
    get_mission()이 연결되기 전까지는 사용자에게 삭제 대상 클립이 실제로 있어도
    무조건 500 FAILED를 반환해야 한다 - 그래야 BE C가 탈퇴를 '완료'로 잘못
    확정해서 실제로는 안 지워진 개인 클립이 남는 사고를 막는다."""
    assert main.mission_lookup.USER_ID_LINKING_WIRED is False  # 이 테스트가 검증하려는 전제

    clip_id = "clip-wc-0"
    _seed_clip_for_user(clip_id, "m-wc-0", user_id="999")

    res = client.post("/api/ai/clips/withdrawal-cleanup", json={"userId": 999, "withdrawalId": 0})

    assert res.status_code == 500
    body = res.json()
    assert body["success"] is False
    assert body["data"]["cleanupStatus"] == "FAILED"
    # 실제로 안 지워졌어야 한다 (성공을 사칭하지 않았다는 증거)
    assert db.get_clip(clip_id)["deleted"] == 0


def test_withdrawal_cleanup_removes_users_clips(client):
    """get_mission() 연결 이후를 가정한 삭제 로직 자체의 검증."""
    clip_id = "clip-wc-1"
    clip_path = _seed_clip_for_user(clip_id, "m-wc-1", user_id="100")

    with _user_id_linking_wired():
        cleanup_res = client.post(
            "/api/ai/clips/withdrawal-cleanup",
            json={"userId": 100, "withdrawalId": 1},
        )
    assert cleanup_res.status_code == 200
    body = cleanup_res.json()
    assert body["data"]["cleanupStatus"] == "COMPLETED"
    assert body["data"]["deletedClipCount"] == 1
    assert body["data"]["idempotent"] is False
    assert db.get_clip(clip_id)["deleted"] == 1
    assert not os.path.exists(clip_path)


def test_withdrawal_cleanup_no_clips_is_idempotent(client):
    with _user_id_linking_wired():
        res = client.post(
            "/api/ai/clips/withdrawal-cleanup",
            json={"userId": 999999, "withdrawalId": 2},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["cleanupStatus"] == "NO_CLIPS"
    assert body["data"]["idempotent"] is True


def test_withdrawal_cleanup_second_call_is_idempotent(client):
    clip_id = "clip-wc-2"
    _seed_clip_for_user(clip_id, "m-wc-2", user_id="200")

    with _user_id_linking_wired():
        first = client.post("/api/ai/clips/withdrawal-cleanup", json={"userId": 200, "withdrawalId": 3})
        assert first.json()["data"]["cleanupStatus"] == "COMPLETED"

        second = client.post("/api/ai/clips/withdrawal-cleanup", json={"userId": 200, "withdrawalId": 3})
    assert second.json()["data"]["cleanupStatus"] == "NO_CLIPS"
    assert second.json()["data"]["idempotent"] is True


def test_withdrawal_cleanup_reports_failure_when_purge_fails(client):
    """스토리지 삭제가 실패하면 500 FAILED를 반환하고, 실패한 클립은 deleted 처리하지 않아
    재호출 시 다시 시도 대상에 남아야 한다(멱등 재시도)."""
    clip_id = "clip-wc-3"
    _seed_clip_for_user(clip_id, "m-wc-3", user_id="300")

    original_purge_clip_file = main.purge_clip_file
    main.purge_clip_file = lambda path: False
    try:
        with _user_id_linking_wired():
            cleanup_res = client.post(
                "/api/ai/clips/withdrawal-cleanup",
                json={"userId": 300, "withdrawalId": 4},
            )
    finally:
        main.purge_clip_file = original_purge_clip_file

    assert cleanup_res.status_code == 500
    body = cleanup_res.json()
    assert body["success"] is False
    assert body["data"]["cleanupStatus"] == "FAILED"
    assert db.get_clip(clip_id)["deleted"] == 0


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    with TestClient(main.app) as client:
        for t in tests:
            t(client)
            print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 API 테스트 전부 통과")
