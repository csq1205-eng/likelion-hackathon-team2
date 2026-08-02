"""
클립 처리 정책 (기능명세서 '개인정보 - 클립 처리 정책'):
- 판정 완료 후, 하이라이트 생성 전까지는 임시 보관
- 비공유 클립: 하이라이트 생성이 끝나면 즉시 파기
- 공유 클립: 사용자가 직접 삭제할 때까지 보관
- 단, 공유 여부와 무관하게 판정 완료 후 24시간이 지나면 무조건 파기 (하드 캡)
"""
import os
from datetime import datetime, timedelta, timezone

RETENTION_HOURS = 24


def should_purge(clip_row) -> bool:
    if clip_row["deleted"]:
        return False

    judgment_time = datetime.fromisoformat(clip_row["judgment_completed_at"])
    hard_cap_reached = datetime.now(timezone.utc) - judgment_time >= timedelta(hours=RETENTION_HOURS)
    if hard_cap_reached:
        return True

    is_shared = bool(clip_row["shared"])
    highlight_done = bool(clip_row["highlight_generated"])

    if not is_shared and highlight_done:
        return True

    # 공유 클립은 사용자가 직접 삭제(DELETE 엔드포인트)하기 전까지는
    # 하드 캡(24시간) 전까지 보관한다.
    return False


def purge_clip_file(file_path: str):
    if os.path.exists(file_path):
        os.remove(file_path)
