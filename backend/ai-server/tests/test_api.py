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

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# storage/, clips.db 같은 상대경로가 실행 위치를 더럽히지 않도록 임시 디렉토리로 이동
os.chdir(tempfile.mkdtemp())

from fastapi.testclient import TestClient
import db
import main
from models import VerdictResponse, Criterion


def _fake_clip_bytes():
    return io.BytesIO(b"fake video bytes")  # frame_extraction은 mock되므로 진짜 영상일 필요 없음


def _pass_verdict(mission_id, mission_label, clip_id, clip_path):
    return VerdictResponse(
        mission_id=mission_id, clip_id=clip_id, verdict="pass", confidence=0.95,
        criteria=[Criterion(id="target_action_detected", met=True)],
        model_notes="테스트용 고정 응답", processed_at="2026-08-01T00:00:00+00:00",
    )


def _fail_verdict(mission_id, mission_label, clip_id, clip_path):
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

    res = client.post(f"/api/clips/{clip_id}/highlight-complete")
    assert res.status_code == 200
    assert res.json()["purged"] is True
    assert db.get_clip(clip_id)["deleted"] == 1


def test_status_endpoint_for_completed_clip(client):
    main.process_clip = _pass_verdict
    clip_id = _upload(client, "m-api-6").json()["clip_id"]

    status_res = client.get(f"/api/clips/{clip_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "completed"


def test_missing_clip_returns_404(client):
    res = client.patch("/api/clips/does-not-exist/share", json={"shared": True})
    assert res.status_code == 404


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    with TestClient(main.app) as client:
        for t in tests:
            t(client)
            print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 API 테스트 전부 통과")
