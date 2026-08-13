from app.services.vision_service import VisionVerdict
from tests.conftest import auth_header, fake_clip_file


def _upload(client, fake_vision, user_id=1, mission_id=100, shared=True):
    fake_vision.queue(VisionVerdict(verdict="PASS", confidence_score=91.0, criteria=[], model_notes="ok"))
    response = client.post(
        "/api/clips/upload",
        data={"missionId": str(mission_id), "shared": str(shared).lower()},
        files={"clip": fake_clip_file()},
        headers=auth_header(user_id=user_id),
    )
    assert response.status_code == 200
    return response.json()["data"]


def test_withdrawal_cleanup_removes_all_clips(client, fake_vision):
    _upload(client, fake_vision, user_id=42, mission_id=1)
    _upload(client, fake_vision, user_id=42, mission_id=2, shared=False)

    response = client.post(
        "/api/ai/clips/withdrawal-cleanup",
        json={"userId": 42, "withdrawalId": 10, "requestedAt": "2026-08-04T10:30:00"},
        headers={"X-Internal-Key": "test-internal-key"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["cleanupStatus"] == "COMPLETED"
    assert data["deletedClipCount"] == 2
    assert data["idempotent"] is False


def test_withdrawal_cleanup_is_idempotent(client, fake_vision):
    _upload(client, fake_vision, user_id=43, mission_id=1)

    first = client.post(
        "/api/ai/clips/withdrawal-cleanup",
        json={"userId": 43, "withdrawalId": 11},
        headers={"X-Internal-Key": "test-internal-key"},
    )
    assert first.json()["data"]["cleanupStatus"] == "COMPLETED"

    second = client.post(
        "/api/ai/clips/withdrawal-cleanup",
        json={"userId": 43, "withdrawalId": 11},
        headers={"X-Internal-Key": "test-internal-key"},
    )
    body = second.json()["data"]
    assert body["cleanupStatus"] == "NO_CLIPS"
    assert body["idempotent"] is True


def test_withdrawal_cleanup_requires_internal_key(client):
    response = client.post(
        "/api/ai/clips/withdrawal-cleanup",
        json={"userId": 1, "withdrawalId": 1},
    )
    assert response.status_code == 401
