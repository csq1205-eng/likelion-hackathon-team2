import os

# 자동 테스트가 실제 OpenAI/BE A/BE C 호출을 하지 않도록 격리한다 (be-a와 동일한 패턴).
os.environ["OPENAI_API_KEY"] = ""
os.environ["BE_A_BASE_URL"] = ""
os.environ["BE_C_BASE_URL"] = ""

import io
from typing import List, Optional

import pytest
from fastapi.testclient import TestClient

from app.services.vision_service import VisionCriterion, VisionVerdict


class FakeVisionService:
    """실제 OpenAI 호출 없이 미리 정해둔 verdict 큐를 순서대로 반환한다."""

    def __init__(self, verdicts: Optional[List[VisionVerdict]] = None):
        self.model = "fake-vision-model"
        self._queue = list(verdicts or [])
        self.calls = 0
        self.last_mission_title = None
        self.last_criteria_hint = None

    def queue(self, verdict: VisionVerdict) -> None:
        self._queue.append(verdict)

    def queue_error(self, exception: Exception) -> None:
        self._queue.append(exception)

    def judge(self, frame_paths, mission_title=None, criteria_hint=None) -> VisionVerdict:
        self.calls += 1
        self.last_mission_title = mission_title
        self.last_criteria_hint = criteria_hint
        if not self._queue:
            return VisionVerdict(verdict="PASS", confidence_score=95.0, criteria=[], model_notes="default pass")
        item = self._queue.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


class FakeReasonClient:
    def __init__(self):
        self.last_mission_title = None

    def get_reason(self, mission_id, clip_id, verdict, confidence_score, criteria, model_notes, mission_title=None):
        self.last_mission_title = mission_title
        return f"[fake reason] {verdict}", "FALLBACK"


class FakeMissionResultClient:
    def __init__(self):
        self.calls = []

    def notify_result(
        self,
        mission_id,
        clip_id,
        result,
        judged_at,
        reason=None,
        confidence_score=None,
        prompt_version=None,
        model_version=None,
    ):
        self.calls.append(
            {
                "mission_id": mission_id,
                "clip_id": clip_id,
                "result": result,
                "judged_at": judged_at,
                "reason": reason,
                "confidence_score": confidence_score,
                "prompt_version": prompt_version,
                "model_version": model_version,
            }
        )


def fake_frame_extractor(clip_path, save_frame, frame_count: int = 4):
    """ffmpeg 없이도 프레임 4장을 만들어낸 것처럼 동작한다."""
    for order in range(1, 5):
        tmp_path = clip_path.with_suffix(f".frame{order}.jpg")
        tmp_path.write_bytes(b"fake-jpeg-bytes")
        save_frame(order, tmp_path)
        tmp_path.unlink(missing_ok=True)
    return 4


@pytest.fixture()
def storage(tmp_path, monkeypatch):
    monkeypatch.setenv("STORAGE_ROOT", str(tmp_path))
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "clips.db"))
    monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-key")
    monkeypatch.setenv("MAX_UPLOAD_MB", "20")
    monkeypatch.setenv("MAX_FAIL_RETRY_COUNT", "3")
    monkeypatch.setenv("MAX_TOTAL_ATTEMPT_COUNT", "6")
    monkeypatch.setenv("DAILY_AI_JUDGEMENT_LIMIT", "10")

    from app.db import init_db

    init_db()
    return tmp_path


@pytest.fixture()
def fake_vision():
    return FakeVisionService()


@pytest.fixture()
def fake_reason_client():
    return FakeReasonClient()


@pytest.fixture()
def fake_mission_result_client():
    return FakeMissionResultClient()


@pytest.fixture()
def client(storage, fake_vision, fake_reason_client, fake_mission_result_client, monkeypatch):
    from app.main import app
    from app.services.clip_service import ClipService
    from app.services.withdrawal_service import WithdrawalService
    import app.routers.clips as clips_router
    import app.routers.internal as internal_router

    test_clip_service = ClipService(
        vision_service=fake_vision,
        reason_client=fake_reason_client,
        frame_extractor=fake_frame_extractor,
        mission_result_client=fake_mission_result_client,
    )
    monkeypatch.setattr(clips_router, "service", test_clip_service)
    monkeypatch.setattr(internal_router, "service", WithdrawalService())

    with TestClient(app) as test_client:
        yield test_client


def auth_header(user_id: int = 1) -> dict:
    return {"Authorization": f"Bearer temporary-token-{user_id}"}


def fake_clip_file(name: str = "clip.mp4") -> tuple:
    return (name, io.BytesIO(b"fake-mp4-bytes" * 100), "video/mp4")
