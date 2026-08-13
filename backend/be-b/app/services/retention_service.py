import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from app.config import settings
from app.storage import delete_clip_assets

KEEP_UNTIL_HIGHLIGHT_COMPLETE = "KEEP_UNTIL_HIGHLIGHT_COMPLETE"
KEEP_24_HOURS = "KEEP_24_HOURS"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def compute_retention(shared: bool, judged_at: Optional[datetime]) -> Tuple[str, Optional[str]]:
    """명세서 7장 enum과 12.1 예시 응답 기준: 공유 클립은 판정 완료 후 24시간,
    비공유 클립은 하이라이트 생성 완료 시점까지 보관한다."""
    if shared and judged_at is not None:
        expires_at = judged_at + timedelta(hours=settings.shared_clip_retention_hours)
        return KEEP_24_HOURS, expires_at.isoformat()
    if shared:
        # 아직 판정이 끝나지 않은 상태(202)에서는 만료 시각을 정할 수 없다.
        return KEEP_24_HOURS, None
    return KEEP_UNTIL_HIGHLIGHT_COMPLETE, None


def purge_clip(conn: sqlite3.Connection, clip_row: sqlite3.Row) -> None:
    if clip_row["deleted"]:
        return
    delete_clip_assets(clip_row["source_clip_path"], clip_row["clip_id"])
    conn.execute(
        "UPDATE mission_clips SET deleted = 1, deleted_at = ? WHERE clip_id = ?",
        (now_iso(), clip_row["clip_id"]),
    )


def purge_expired_shared_clips(conn: sqlite3.Connection) -> int:
    """공유 클립 중 24시간 보관 기간이 지난 것을 파기한다. 백그라운드 스케줄러가 주기 호출."""
    rows = conn.execute(
        """
        SELECT * FROM mission_clips
        WHERE deleted = 0
          AND retention_policy = ?
          AND retention_expires_at IS NOT NULL
          AND retention_expires_at <= ?
        """,
        (KEEP_24_HOURS, now_iso()),
    ).fetchall()

    for row in rows:
        purge_clip(conn, row)

    return len(rows)
