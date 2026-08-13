import sqlite3
from contextlib import contextmanager
from pathlib import Path

from app.config import settings

_SCHEMA = """
CREATE TABLE IF NOT EXISTS mission_clips (
    clip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    attempt_no INTEGER NOT NULL,
    source_clip_url TEXT NOT NULL,
    source_clip_path TEXT NOT NULL,
    shared INTEGER NOT NULL,
    share_decided INTEGER NOT NULL DEFAULT 1,
    retention_policy TEXT NOT NULL,
    retention_expires_at TEXT,
    highlight_generated_at TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    mission_title TEXT,
    criteria_hint TEXT
);

CREATE TABLE IF NOT EXISTS mission_clip_frames (
    frame_id INTEGER PRIMARY KEY AUTOINCREMENT,
    clip_id INTEGER NOT NULL REFERENCES mission_clips(clip_id),
    frame_url TEXT NOT NULL,
    frame_path TEXT NOT NULL,
    frame_order INTEGER NOT NULL,
    extracted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_judgement_requests (
    judgement_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    clip_id INTEGER NOT NULL REFERENCES mission_clips(clip_id),
    mission_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    reason TEXT,
    confidence_score REAL,
    prompt_version TEXT,
    model_version TEXT,
    model_notes TEXT,
    requested_at TEXT NOT NULL,
    judged_at TEXT
);

CREATE TABLE IF NOT EXISTS mission_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    clip_id INTEGER NOT NULL,
    result TEXT NOT NULL,
    judged_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_ai_judgement_limits (
    user_id INTEGER NOT NULL,
    limit_date TEXT NOT NULL,
    call_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, limit_date)
);
"""


def get_connection() -> sqlite3.Connection:
    db_path = Path(settings.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=10000")
    conn.row_factory = sqlite3.Row
    return conn


# CREATE TABLE IF NOT EXISTS는 이미 만들어진 테이블에 새 컬럼을 추가해주지 않으므로,
# 배포된 DB에 컬럼을 뒤늦게 추가할 때는 여기에 추가하고 마이그레이션으로 처리한다.
_COLUMN_MIGRATIONS = [
    ("mission_clips", "mission_title", "TEXT"),
    ("mission_clips", "criteria_hint", "TEXT"),
]


def _run_migrations(conn: sqlite3.Connection) -> None:
    for table, column, column_type in _COLUMN_MIGRATIONS:
        existing_columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
        if column not in existing_columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(_SCHEMA)
        _run_migrations(conn)
        conn.commit()
    finally:
        conn.close()


@contextmanager
def db_session():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
