"""
클립 처리 정책을 위한 최소 메타데이터 저장소.
실서비스에서는 BE C의 메인 DB로 옮겨가도 되지만,
지금은 BE B 단독으로 검증 가능하도록 SQLite로 둔다.
"""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

DB_PATH = "storage/clips.db"


def init_db():
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS clips (
                clip_id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                judgment_completed_at TEXT NOT NULL,
                shared INTEGER NOT NULL DEFAULT 0,
                highlight_generated INTEGER NOT NULL DEFAULT 0,
                deleted INTEGER NOT NULL DEFAULT 0,
                deleted_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS retry_counts (
                mission_id TEXT PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS upload_jobs (
                job_id TEXT PRIMARY KEY,
                mission_id TEXT NOT NULL,
                mission_label TEXT NOT NULL,
                clip_path TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                attempts INTEGER NOT NULL DEFAULT 0,
                max_attempts INTEGER NOT NULL DEFAULT 5,
                verdict_json TEXT,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)


@contextmanager
def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def create_clip_record(clip_id: str, mission_id: str, file_path: str):
    with _connect() as conn:
        conn.execute(
            "INSERT INTO clips (clip_id, mission_id, file_path, judgment_completed_at) VALUES (?, ?, ?, ?)",
            (clip_id, mission_id, file_path, datetime.now(timezone.utc).isoformat()),
        )


def set_shared(clip_id: str, shared: bool):
    with _connect() as conn:
        conn.execute("UPDATE clips SET shared = ? WHERE clip_id = ?", (int(shared), clip_id))


def set_highlight_generated(clip_id: str):
    with _connect() as conn:
        conn.execute("UPDATE clips SET highlight_generated = 1 WHERE clip_id = ?", (clip_id,))


def mark_deleted(clip_id: str):
    with _connect() as conn:
        conn.execute(
            "UPDATE clips SET deleted = 1, deleted_at = ? WHERE clip_id = ?",
            (datetime.now(timezone.utc).isoformat(), clip_id),
        )


def get_clip(clip_id: str) -> Optional[sqlite3.Row]:
    with _connect() as conn:
        cur = conn.execute("SELECT * FROM clips WHERE clip_id = ?", (clip_id,))
        return cur.fetchone()


def get_active_clips():
    """아직 삭제되지 않은 클립 전체 (스케줄러가 매 틱마다 검사)"""
    with _connect() as conn:
        cur = conn.execute("SELECT * FROM clips WHERE deleted = 0")
        return cur.fetchall()


# ---- 재촬영 횟수 제한 ----
# 실제 판정 실패('fail') 또는 재시도 불가능한 오류만 카운트한다.
# 네트워크 오류로 인한 시스템 내부 재시도는 사용자 횟수를 차감하지 않는다.

def get_retry_count(mission_id: str) -> int:
    with _connect() as conn:
        cur = conn.execute("SELECT count FROM retry_counts WHERE mission_id = ?", (mission_id,))
        row = cur.fetchone()
        return row["count"] if row else 0


def increment_retry_count(mission_id: str):
    with _connect() as conn:
        conn.execute("""
            INSERT INTO retry_counts (mission_id, count, updated_at)
            VALUES (?, 1, ?)
            ON CONFLICT(mission_id) DO UPDATE SET
                count = count + 1,
                updated_at = excluded.updated_at
        """, (mission_id, datetime.now(timezone.utc).isoformat()))


# ---- 네트워크 오류 재처리 큐 ----

def create_job(job_id: str, mission_id: str, mission_label: str, clip_path: str, max_attempts: int = 5):
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute("""
            INSERT INTO upload_jobs
                (job_id, mission_id, mission_label, clip_path, status, attempts, max_attempts, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?)
        """, (job_id, mission_id, mission_label, clip_path, max_attempts, now, now))


def get_job(job_id: str) -> Optional[sqlite3.Row]:
    with _connect() as conn:
        cur = conn.execute("SELECT * FROM upload_jobs WHERE job_id = ?", (job_id,))
        return cur.fetchone()


def get_pending_jobs():
    """재시도 여력이 남은(pending & attempts < max_attempts) 작업만 가져온다."""
    with _connect() as conn:
        cur = conn.execute("SELECT * FROM upload_jobs WHERE status = 'pending' AND attempts < max_attempts")
        return cur.fetchall()


def mark_job_attempt_failed(job_id: str, error_message: str):
    """재시도 가능한 오류. attempts만 늘리고 status는 pending 유지."""
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET attempts = attempts + 1, error_message = ?, updated_at = ? WHERE job_id = ?",
            (error_message, now, job_id),
        )


def mark_job_status_failed(job_id: str, error_message: str):
    """더 이상 재시도하지 않고 완전히 실패 처리."""
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE job_id = ?",
            (error_message, now, job_id),
        )


def mark_job_completed(job_id: str, verdict_json: str):
    now = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET status = 'completed', verdict_json = ?, updated_at = ? WHERE job_id = ?",
            (verdict_json, now, job_id),
        )
