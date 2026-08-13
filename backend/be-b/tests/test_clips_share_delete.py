from app.services.vision_service import VisionVerdict
from tests.conftest import auth_header, fake_clip_file


def _upload_and_pass(client, fake_vision, mission_id=100, shared=True):
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=91.0, criteria=[], model_notes="ok"))
    response = client.post(
        "/api/clips/upload",
        data={"missionId": str(mission_id), "shared": str(shared).lower()},
        files={"clip": fake_clip_file()},
        headers=auth_header(),
    )
    assert response.status_code == 200
    return response.json()["data"]


def test_get_result_returns_completed_judgement(client, fake_vision):
    data = _upload_and_pass(client, fake_vision)
    clip_id = data["clipId"]

    response = client.get(f"/api/clips/{clip_id}/result", headers=auth_header())

    assert response.status_code == 200
    result = response.json()["data"]
    assert result["status"] == "COMPLETED"
    assert result["result"] == "PASS"


def test_get_result_for_other_users_clip_returns_404(client, fake_vision):
    data = _upload_and_pass(client, fake_vision)
    clip_id = data["clipId"]

    response = client.get(f"/api/clips/{clip_id}/result", headers=auth_header(user_id=999))

    assert response.status_code == 404
    assert response.json()["code"] == "CLIP-001"


def test_patch_share_updates_retention(client, fake_vision):
    data = _upload_and_pass(client, fake_vision, shared=False)
    clip_id = data["clipId"]
    assert data["retentionPolicy"] == "KEEP_UNTIL_HIGHLIGHT_COMPLETE"

    response = client.patch(
        f"/api/clips/{clip_id}/share", json={"shared": True}, headers=auth_header()
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["shared"] is True
    assert body["retentionPolicy"] == "KEEP_24_HOURS"
    assert body["retentionExpiresAt"] is not None


def test_highlight_complete_purges_non_shared_clip(client, fake_vision):
    data = _upload_and_pass(client, fake_vision, shared=False)
    clip_id = data["clipId"]

    response = client.post(
        f"/api/clips/{clip_id}/highlight-complete",
        headers={"X-Internal-Key": "test-internal-key"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["highlightCompleted"] is True

    # 파기된 클립은 더 이상 조회되지 않는다.
    result = client.get(f"/api/clips/{clip_id}/result", headers=auth_header())
    assert result.status_code == 404


def test_highlight_complete_without_internal_key_is_rejected(client, fake_vision):
    data = _upload_and_pass(client, fake_vision, shared=False)
    clip_id = data["clipId"]

    response = client.post(f"/api/clips/{clip_id}/highlight-complete")

    assert response.status_code == 401


def test_delete_clip_marks_deleted(client, fake_vision):
    data = _upload_and_pass(client, fake_vision, shared=True)
    clip_id = data["clipId"]

    response = client.delete(f"/api/clips/{clip_id}", headers=auth_header())

    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True

    result = client.get(f"/api/clips/{clip_id}/result", headers=auth_header())
    assert result.status_code == 404
