from datetime import datetime, timedelta, timezone

from app.db import db_session
from app.services import retention_service


def _insert_unshared_clip(created_at_days_ago: int, highlight_generated_at=None) -> int:
    created_at = (datetime.now(timezone.utc) - timedelta(days=created_at_days_ago)).isoformat()
    with db_session() as conn:
        cursor = conn.execute(
            """
            INSERT INTO mission_clips (
                mission_id, user_id, attempt_no, source_clip_url, source_clip_path,
                shared, share_decided, retention_policy, retention_expires_at,
                highlight_generated_at, created_at
            ) VALUES (1, 1, 1, 'https://example.com/clip.mp4', 'storage/clips/1.mp4',
                      0, 1, 'KEEP_UNTIL_HIGHLIGHT_COMPLETE', NULL, ?, ?)
            """,
            (highlight_generated_at, created_at),
        )
        return cursor.lastrowid


def test_purge_stale_unshared_clips_removes_old_clip_without_highlight(storage, monkeypatch):
    monkeypatch.setenv("NON_SHARED_CLIP_FORCE_PURGE_DAYS", "7")
    clip_id = _insert_unshared_clip(created_at_days_ago=8)

    with db_session() as conn:
        purged = retention_service.purge_stale_unshared_clips(conn)
        row = conn.execute("SELECT deleted FROM mission_clips WHERE clip_id = ?", (clip_id,)).fetchone()

    assert purged == 1
    assert row["deleted"] == 1


def test_purge_stale_unshared_clips_keeps_recent_clip(storage, monkeypatch):
    monkeypatch.setenv("NON_SHARED_CLIP_FORCE_PURGE_DAYS", "7")
    clip_id = _insert_unshared_clip(created_at_days_ago=1)

    with db_session() as conn:
        purged = retention_service.purge_stale_unshared_clips(conn)
        row = conn.execute("SELECT deleted FROM mission_clips WHERE clip_id = ?", (clip_id,)).fetchone()

    assert purged == 0
    assert row["deleted"] == 0


def test_purge_stale_unshared_clips_keeps_clip_that_received_highlight_complete(storage, monkeypatch):
    monkeypatch.setenv("NON_SHARED_CLIP_FORCE_PURGE_DAYS", "7")
    clip_id = _insert_unshared_clip(
        created_at_days_ago=8,
        highlight_generated_at=datetime.now(timezone.utc).isoformat(),
    )

    with db_session() as conn:
        purged = retention_service.purge_stale_unshared_clips(conn)
        row = conn.execute("SELECT deleted FROM mission_clips WHERE clip_id = ?", (clip_id,)).fetchone()

    assert purged == 0
    assert row["deleted"] == 0
