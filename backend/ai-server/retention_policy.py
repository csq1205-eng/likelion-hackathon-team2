"""
클립 처리 정책 (기능명세서 '개인정보 - 클립 처리 정책'):
- 판정 완료 후, 하이라이트 생성 전까지는 임시 보관
- 비공유 클립: 하이라이트 생성이 끝나면 즉시 파기
- 공유 클립: 사용자가 직접 삭제할 때까지 보관
- 단, 공유 여부와 무관하게 판정 완료 후 24시간이 지나면 무조건 파기 (하드 캡)

추가된 두 가지:
1) 공유 결정 유예 — 사용자가 '공유' 버튼을 누르기 전에 BE A의 highlight-complete 콜백이
   먼저 도착하면 클립이 즉시 사라져 공유가 영영 불가능해진다.
   share_decided(사용자가 공유 여부를 실제로 선택함)가 아직 0이면 유예 시간만큼 기다린다.
2) fail/hold/error 클립 조기 파기 — 하이라이트 대상이 아니므로 24시간을 들고 있을 이유가 없다.
   error(AI-001, 재시도 불가/소진 시스템 오류)는 main.py/scheduler.py가 clips 레코드를
   만드는 시점에 이미 파일을 지워버리므로, DB 판단 기준을 fail/hold와 맞춰야
   "파일은 없는데 deleted=0"인 상태로 24시간씩 남아있지 않는다.

파기 대상은 원본 클립 + 추출된 프레임 이미지 둘 다다. 프레임을 빼먹으면
원본만 지워지고 모델에 보낸 사용자 사진이 디스크에 남는다.
"""
import os
from datetime import datetime, timedelta, timezone

from frame_extraction import cleanup_frames

RETENTION_HOURS = 24
SHARE_DECISION_GRACE_MINUTES = int(os.environ.get("SHARE_DECISION_GRACE_MINUTES", "10"))
FRAME_DIR = "storage/frames"


def _get(row, key, default=None):
    """sqlite3.Row / dict 양쪽에서 안전하게 값을 읽는다 (컬럼이 없는 구버전 행 대응)."""
    try:
        value = row[key]
    except (IndexError, KeyError, TypeError):
        return default
    return default if value is None else value


def _parse_time(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _elapsed_since(value, delta: timedelta) -> bool:
    parsed = _parse_time(value)
    if parsed is None:
        return False
    return datetime.now(timezone.utc) - parsed >= delta


def should_purge(clip_row) -> bool:
    if _get(clip_row, "deleted", 0):
        return False

    judgment_at = _get(clip_row, "judgment_completed_at")

    # 1) 하드 캡: 무엇보다 우선한다.
    if _elapsed_since(judgment_at, timedelta(hours=RETENTION_HOURS)):
        return True

    if bool(_get(clip_row, "shared", 0)):
        # 공유 클립은 사용자가 직접 삭제(DELETE 엔드포인트)하기 전까지 하드 캡까지 보관한다.
        return False

    share_decided = bool(_get(clip_row, "share_decided", 0))
    grace = timedelta(minutes=SHARE_DECISION_GRACE_MINUTES)

    # 2) 하이라이트 대상이 아닌 판정(fail/hold/error)은 보관할 이유가 없다.
    if _get(clip_row, "verdict") in ("fail", "hold", "error"):
        if share_decided:
            return True
        return _elapsed_since(judgment_at, grace)

    # 3) 비공유 + 하이라이트 생성 완료 -> 파기.
    #    단, 사용자가 아직 공유 여부를 고르지 않았다면 유예 시간만큼 기다린다.
    if bool(_get(clip_row, "highlight_generated", 0)):
        if share_decided:
            return True
        return _elapsed_since(
            _get(clip_row, "highlight_generated_at") or judgment_at, grace
        )

    return False


def purge_clip_file(file_path: str) -> bool:
    """원본 클립 파일 삭제. 삭제에 실패하면 False를 반환해
    '삭제됨'으로 잘못 기록되는 걸 막는다(다음 틱에 다시 시도됨)."""
    if not file_path:
        return True
    if not os.path.exists(file_path):
        return True
    try:
        os.remove(file_path)
        return True
    except OSError as e:
        print(f"[retention] 파일 삭제 실패 {file_path}: {e}")
        return False


def purge_clip_assets(clip_id: str, file_path: str) -> bool:
    """원본 클립 + 추출 프레임을 함께 파기한다. 파기 경로는 전부 이 함수를 쓴다."""
    ok = purge_clip_file(file_path)
    if clip_id:
        cleanup_frames(clip_id, FRAME_DIR)
    return ok
