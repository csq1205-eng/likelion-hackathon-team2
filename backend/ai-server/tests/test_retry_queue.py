"""
retry queue (네트워크 오류 대응) 동작 검증.
실제 SQLite 파일(임시 경로)과 scheduler.retry_pending_uploads()를 그대로 사용하되,
process_clip만 가짜로 바꿔서 성공/재시도가능오류/재시도불가오류 세 가지 케이스를 돈다.

실행: python3 tests/test_retry_queue.py
"""
import sys
import os
import tempfile
import httpx
import openai

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db
import scheduler
from errors import is_retryable
from models import VerdictResponse, Criterion


def setup_temp_db():
    tmp_dir = tempfile.mkdtemp()
    db.DB_PATH = os.path.join(tmp_dir, "test_clips.db")
    db.init_db()
    return tmp_dir


def make_retryable_error():
    req = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    return openai.APIConnectionError(request=req)


def test_is_retryable_classifies_correctly():
    assert is_retryable(make_retryable_error()) is True
    assert is_retryable(ValueError("깨진 파일")) is False


def test_retryable_failure_keeps_job_pending_without_charging_user():
    setup_temp_db()
    db.create_job("job-1", "mission-1", "물 마시기", "/tmp/fake.mp4", max_attempts=5)

    scheduler.process_clip = lambda *a, **k: (_ for _ in ()).throw(make_retryable_error())
    scheduler.retry_pending_uploads()

    job = db.get_job("job-1")
    assert job["status"] == "pending"
    assert job["attempts"] == 1
    assert db.get_retry_count("mission-1") == 0  # 네트워크 오류는 사용자 횟수를 차감하지 않음


def test_retryable_failure_exceeding_max_attempts_marks_failed_and_charges_user():
    setup_temp_db()
    db.create_job("job-2", "mission-2", "물 마시기", "/tmp/fake.mp4", max_attempts=2)

    scheduler.process_clip = lambda *a, **k: (_ for _ in ()).throw(make_retryable_error())
    scheduler.retry_pending_uploads()  # attempts -> 1
    scheduler.retry_pending_uploads()  # attempts -> 2 == max_attempts -> failed

    job = db.get_job("job-2")
    assert job["status"] == "failed"
    assert db.get_retry_count("mission-2") == 1


def test_non_retryable_failure_marks_failed_immediately():
    setup_temp_db()
    db.create_job("job-3", "mission-3", "물 마시기", "/tmp/fake.mp4", max_attempts=5)

    scheduler.process_clip = lambda *a, **k: (_ for _ in ()).throw(ValueError("깨진 파일"))
    scheduler.retry_pending_uploads()

    job = db.get_job("job-3")
    assert job["status"] == "failed"
    assert db.get_retry_count("mission-3") == 1


def test_successful_retry_completes_job_and_creates_clip_record():
    setup_temp_db()
    db.create_job("job-4", "mission-4", "물 마시기", "/tmp/fake.mp4", max_attempts=5)

    fake_verdict = VerdictResponse(
        mission_id="mission-4",
        clip_id="job-4",
        verdict="pass",
        confidence=0.9,
        criteria=[Criterion(id="target_action_detected", met=True)],
        model_notes="테스트용 고정 응답",
        processed_at="2026-08-01T00:00:00+00:00",
    )
    scheduler.process_clip = lambda *a, **k: fake_verdict
    scheduler.retry_pending_uploads()

    job = db.get_job("job-4")
    assert job["status"] == "completed"
    clip = db.get_clip("job-4")
    assert clip is not None


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 테스트 전부 통과")
