"""
- 24시간 파기 정책을 주기적으로 검사/실행하는 스케줄러
- 네트워크 오류로 큐에 쌓인 업로드를 주기적으로 재처리

해커톤 스코프: 단일 프로세스 내 APScheduler (Redis/Celery 불필요).
"""
from apscheduler.schedulers.background import BackgroundScheduler

import db
from db import MAX_TOTAL_ATTEMPTS
from retention_policy import should_purge, purge_clip_assets
from pipeline import process_clip, parse_criteria
from errors import is_retryable

scheduler = BackgroundScheduler(timezone="UTC")


def purge_expired_clips():
    clips = db.get_active_clips()
    purged = 0
    for clip in clips:
        if not should_purge(clip):
            continue
        # 파일 삭제에 실패하면 deleted로 기록하지 않는다 -> 다음 틱에 다시 시도된다.
        if purge_clip_assets(clip["clip_id"], clip["file_path"]):
            db.mark_deleted(clip["clip_id"])
            purged += 1
    if purged:
        print(f"[retention] {purged}개 클립 파기 완료")


def retry_pending_uploads():
    """네트워크 오류로 큐에 쌓인 업로드를 재시도한다.
    - 성공: 완료 처리 + 클립 처리 정책(파기 카운트) 시작
    - 재시도 가능한 오류가 또 나면: attempts만 늘리고 다음 틱에 다시 시도
    - 최대 재시도 횟수 초과 / 재시도 불가능한 오류: 완전 실패 처리 + 클립 파일 정리
      + 사용자 재촬영 횟수 차감
    """
    jobs = db.get_pending_jobs()
    for job in jobs:
        mission_id = job["mission_id"]
        job_id = job["job_id"]
        clip_path = job["clip_path"]

        # 큐를 통한 재시도도 미션의 총 판정 호출 상한을 우회해선 안 된다.
        # 업로드 시점 체크(main.py)와 달리 여기서 걸리면 이미 파일이 존재하므로
        # 종료 상태로 정리하고 파기까지 해야 job이 pending으로 영원히 남지 않는다.
        # count(재촬영 횟수)는 차감하지 않는다 - 이건 판정 실패가 아니라 비용 가드다.
        if db.get_total_attempts(mission_id) >= MAX_TOTAL_ATTEMPTS:
            db.mark_job_status_failed(job_id, "이 미션의 인증 시도 한도를 초과했습니다.")
            purge_clip_assets(job_id, clip_path)
            continue

        db.increment_total_attempts(mission_id)

        try:
            verdict = process_clip(
                mission_id,
                job["mission_label"],
                job_id,
                clip_path,
                criteria=parse_criteria(_get(job, "criteria_json")),
            )
        except Exception as e:
            if is_retryable(e):
                db.mark_job_attempt_failed(job_id, str(e))
                updated = db.get_job(job_id)
                if updated["attempts"] >= updated["max_attempts"]:
                    db.mark_job_status_failed(job_id, "최대 재시도 횟수 초과")
                    db.increment_retry_count(mission_id)
                    # clips 테이블에 들어간 적 없는 파일이라 파기 스케줄러가 못 찾는다.
                    # 여기서 직접 지우지 않으면 영구히 남는다.
                    purge_clip_assets(job_id, clip_path)
            else:
                db.mark_job_status_failed(job_id, str(e))
                db.increment_retry_count(mission_id)
                purge_clip_assets(job_id, clip_path)
            continue

        # --- 성공 경로 ---
        # 여기서 예외가 나면 job이 pending으로 남아 다음 틱에 같은 클립을 또 판정한다(중복 과금).
        # 어떤 실패가 나더라도 job은 반드시 종료 상태로 만든다.
        try:
            if verdict.verdict == "fail":
                db.increment_retry_count(mission_id)
            elif verdict.verdict == "pass":
                db.reset_retry_count(mission_id)

            db.create_clip_record(job_id, mission_id, clip_path, verdict.verdict)
        except Exception as e:
            print(f"[retry-queue] 판정 후 기록 실패 {job_id}: {e}")
        finally:
            db.mark_job_completed(job_id, verdict.model_dump_json())

    if jobs:
        print(f"[retry-queue] {len(jobs)}건 재처리 시도")


def _get(row, key, default=None):
    try:
        return row[key]
    except (IndexError, KeyError, TypeError):
        return default


def start_scheduler():
    # 데모/개발 중엔 짧은 간격. 운영 전환 시 필요에 맞게 조정.
    # max_instances=1: 한 틱이 오래 걸려도 같은 잡이 겹쳐 돌지 않게 한다(중복 판정 방지).
    # coalesce=True  : 밀린 실행은 하나로 합친다.
    scheduler.add_job(
        purge_expired_clips, "interval", minutes=5, id="purge_expired_clips",
        max_instances=1, coalesce=True, misfire_grace_time=60,
    )
    scheduler.add_job(
        retry_pending_uploads, "interval", minutes=2, id="retry_pending_uploads",
        max_instances=1, coalesce=True, misfire_grace_time=60,
    )
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown(wait=False)
