"""
- 24시간 파기 정책을 주기적으로 검사/실행하는 스케줄러
- 네트워크 오류로 큐에 쌓인 업로드를 주기적으로 재처리

해커톤 스코프: 단일 프로세스 내 APScheduler (Redis/Celery 불필요).
"""
from apscheduler.schedulers.background import BackgroundScheduler
import db
from retention_policy import should_purge, purge_clip_file
from pipeline import process_clip
from errors import is_retryable

scheduler = BackgroundScheduler(timezone="UTC")


def purge_expired_clips():
    clips = db.get_active_clips()
    purged = 0
    for clip in clips:
        if should_purge(clip):
            purge_clip_file(clip["file_path"])
            db.mark_deleted(clip["clip_id"])
            purged += 1
    if purged:
        print(f"[retention] {purged}개 클립 파기 완료")


def retry_pending_uploads():
    """네트워크 오류로 큐에 쌓인 업로드를 재시도한다.
    - 성공: 완료 처리 + 클립 처리 정책(파기 카운트) 시작
    - 재시도 가능한 오류가 또 나면: attempts만 늘리고 다음 틱에 다시 시도
    - 최대 재시도 횟수 초과 / 재시도 불가능한 오류: 완전 실패 처리, 사용자 재촬영 횟수 차감
    """
    jobs = db.get_pending_jobs()
    for job in jobs:
        try:
            verdict = process_clip(job["mission_id"], job["mission_label"], job["job_id"], job["clip_path"])
        except Exception as e:
            if is_retryable(e):
                db.mark_job_attempt_failed(job["job_id"], str(e))
                updated = db.get_job(job["job_id"])
                if updated["attempts"] >= updated["max_attempts"]:
                    db.mark_job_status_failed(job["job_id"], "최대 재시도 횟수 초과")
                    db.increment_retry_count(job["mission_id"])
            else:
                db.mark_job_status_failed(job["job_id"], str(e))
                db.increment_retry_count(job["mission_id"])
            continue

        if verdict.verdict == "fail":
            db.increment_retry_count(job["mission_id"])

        db.create_clip_record(job["job_id"], job["mission_id"], job["clip_path"])
        db.mark_job_completed(job["job_id"], verdict.model_dump_json())

    if jobs:
        print(f"[retry-queue] {len(jobs)}건 재처리 시도")


def start_scheduler():
    # 데모/개발 중엔 짧은 간격. 운영 전환 시 필요에 맞게 조정.
    scheduler.add_job(purge_expired_clips, "interval", minutes=5, id="purge_expired_clips")
    scheduler.add_job(retry_pending_uploads, "interval", minutes=2, id="retry_pending_uploads")
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
