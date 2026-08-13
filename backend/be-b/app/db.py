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
    created_at TEXT NOT NULL
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


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(_SCHEMA)
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
