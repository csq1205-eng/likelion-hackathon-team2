"""
클립 처리 정책을 위한 최소 메타데이터 저장소.

BE C(Java/Spring)의 메인 DB로 이관하지 않는다 (8/3 확정: 서버 분리 구조).
BE B가 자체 SQLite로 관리하고, 최종 판정 결과만 API로 서비스 경계를 넘는다.

동시성: 요청 스레드와 스케줄러 스레드가 같은 파일을 쓰므로
WAL 모드 + busy_timeout으로 'database is locked'를 방지한다.
"""
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

DB_PATH = os.environ.get("CLIPS_DB_PATH", "storage/clips.db")
BUSY_TIMEOUT_MS = 10000

# verdict와 무관한 미션당 총 판정 호출 상한 (hold 무한 반복 → API 비용 방어).
# main.py(신규 업로드)와 scheduler.py(재처리 큐) 양쪽에서 같은 값을 참조해야
# 큐를 통한 재시도가 이 상한을 우회하지 못한다.
MAX_TOTAL_ATTEMPTS = 6


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
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

        # --- 기존 DB 파일에 대한 컬럼 마이그레이션 (지우고 다시 만들 필요 없음) ---
        _ensure_column(conn, "clips", "verdict", "verdict TEXT")
        _ensure_column(conn, "clips", "share_decided", "share_decided INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "clips", "highlight_generated_at", "highlight_generated_at TEXT")
        _ensure_column(conn, "retry_counts", "total_attempts", "total_attempts INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "upload_jobs", "criteria_json", "criteria_json TEXT")

        conn.execute("CREATE INDEX IF NOT EXISTS idx_clips_active ON clips(deleted)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON upload_jobs(status)")


def _ensure_column(conn, table: str, column: str, ddl: str):
    existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in existing:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")


@contextmanager
def _connect():
    conn = sqlite3.connect(DB_PATH, timeout=BUSY_TIMEOUT_MS / 1000)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(f"PRAGMA busy_timeout={BUSY_TIMEOUT_MS}")
        yield conn
        conn.commit()
    finally:
        conn.close()


# ---- 클립 처리 정책 ----

def create_clip_record(clip_id: str, mission_id: str, file_path: str, verdict: Optional[str] = None):
    """판정 완료 시점 기록. 24시간 파기 카운트가 여기서 시작된다.
    재처리 큐가 같은 job을 두 번 처리하는 경우를 대비해 중복 삽입은 무시한다."""
    with _connect() as conn:
        conn.execute(
            """INSERT INTO clips (clip_id, mission_id, file_path, judgment_completed_at, verdict)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(clip_id) DO NOTHING""",
            (clip_id, mission_id, file_path, _now(), verdict),
        )


def set_shared(clip_id: str, shared: bool):
    """사용자가 공유 여부를 '결정'했음을 함께 기록한다.
    share_decided가 0인 동안에는 하이라이트 콜백이 와도 즉시 파기하지 않는다(유예)."""
    with _connect() as conn:
        conn.execute(
            "UPDATE clips SET shared = ?, share_decided = 1 WHERE clip_id = ?",
            (int(shared), clip_id),
        )


def set_highlight_generated(clip_id: str):
    with _connect() as conn:
        conn.execute(
            "UPDATE clips SET highlight_generated = 1, highlight_generated_at = ? WHERE clip_id = ?",
            (_now(), clip_id),
        )


def mark_deleted(clip_id: str):
    with _connect() as conn:
        conn.execute(
            "UPDATE clips SET deleted = 1, deleted_at = ? WHERE clip_id = ?",
            (_now(), clip_id),
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
# count         : 실제 판정 실패('fail') 또는 재시도 불가능한 오류만 카운트. 판정 통과 시 리셋.
# total_attempts: verdict와 무관한 총 판정 호출 수. hold 무한 반복으로 API 비용이 새는 걸 막는 상한.
#
# 주의: mission_id의 스코프(미션 정의 ID인지 "사용자x날짜" 인스턴스 ID인지)에 따라
#       이 카운터의 의미가 완전히 달라진다. BE A/C와 합의된 값이 들어와야 한다.
#       미션 정의 ID가 들어오면 한 사람의 실패가 전체 사용자를 막는다.

def get_retry_count(mission_id: str) -> int:
    with _connect() as conn:
        cur = conn.execute("SELECT count FROM retry_counts WHERE mission_id = ?", (mission_id,))
        row = cur.fetchone()
        return row["count"] if row else 0


def get_total_attempts(mission_id: str) -> int:
    with _connect() as conn:
        cur = conn.execute("SELECT total_attempts FROM retry_counts WHERE mission_id = ?", (mission_id,))
        row = cur.fetchone()
        if not row:
            return 0
        return row["total_attempts"] or 0


def increment_retry_count(mission_id: str):
    with _connect() as conn:
        conn.execute("""
            INSERT INTO retry_counts (mission_id, count, total_attempts, updated_at)
            VALUES (?, 1, 0, ?)
            ON CONFLICT(mission_id) DO UPDATE SET
                count = count + 1,
                updated_at = excluded.updated_at
        """, (mission_id, _now()))


def increment_total_attempts(mission_id: str):
    with _connect() as conn:
        conn.execute("""
            INSERT INTO retry_counts (mission_id, count, total_attempts, updated_at)
            VALUES (?, 0, 1, ?)
            ON CONFLICT(mission_id) DO UPDATE SET
                total_attempts = total_attempts + 1,
                updated_at = excluded.updated_at
        """, (mission_id, _now()))


def reset_retry_count(mission_id: str):
    """판정을 통과하면 실패 카운트를 되돌린다.
    (이게 없으면 한 번 통과한 뒤에도 과거 실패가 계속 남아 다음 인증을 막는다)"""
    with _connect() as conn:
        conn.execute(
            "UPDATE retry_counts SET count = 0, updated_at = ? WHERE mission_id = ?",
            (_now(), mission_id),
        )


# ---- 네트워크 오류 재처리 큐 ----

def create_job(job_id: str, mission_id: str, mission_label: str, clip_path: str,
               max_attempts: int = 5, criteria_json: Optional[str] = None):
    now = _now()
    with _connect() as conn:
        conn.execute("""
            INSERT INTO upload_jobs
                (job_id, mission_id, mission_label, clip_path, status, attempts, max_attempts,
                 criteria_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)
        """, (job_id, mission_id, mission_label, clip_path, max_attempts, criteria_json, now, now))


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
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET attempts = attempts + 1, error_message = ?, updated_at = ? WHERE job_id = ?",
            (error_message, _now(), job_id),
        )


def mark_job_status_failed(job_id: str, error_message: str):
    """더 이상 재시도하지 않고 완전히 실패 처리."""
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE job_id = ?",
            (error_message, _now(), job_id),
        )


def mark_job_completed(job_id: str, verdict_json: str):
    with _connect() as conn:
        conn.execute(
            "UPDATE upload_jobs SET status = 'completed', verdict_json = ?, updated_at = ? WHERE job_id = ?",
            (verdict_json, _now(), job_id),
        )
