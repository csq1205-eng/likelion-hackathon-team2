"""
어뷰징 방지 정책 (기능명세서 18.3, 18.4)

- 18.3 미션 유효 시간대 검증 (오류코드 MISSION-004)
  클립 업로드 시각이 해당 미션 슬롯의 유효 시간대 안인지 서버 수신 시각
  기준으로 확인한다. 클라이언트 시간은 조작 가능하므로 신뢰하지 않는다.

- 18.4 일일 AI 판정 호출 횟수 제한 (오류코드 MISSION-005)
  사용자 1인당 하루 AI 판정 API 호출 횟수를 제한해 비용을 통제한다.

이 파일은 순수 정책 로직만 담는다. DB 접근(카운트 조회/증가)은 db.py에
위임하고, 이 파일의 함수들은 datetime과 int만 주고받는다 — 테스트하기
쉽게 하기 위한 의도적인 분리다.
"""

from datetime import datetime, time

# ---------------------------------------------------------------------------
# 18.3 미션 유효 시간대 검증
# ---------------------------------------------------------------------------
#
# TODO(승환님/민교님 확인 필요): 슬롯별 시간대는 임시값이다.
# - 슬롯 종료 후 유예시간(grace period)을 둘지
# - 자정을 넘겨서도 전날 미션을 제출 가능하게 할지
# 위 두 가지는 기획 확인 후 조정할 것. 지금은 슬롯 시간대를 딱 붙여서
# 나눴고 유예시간은 0으로 뒀다.
MISSION_SLOT_WINDOWS: dict[str, tuple[time, time]] = {
    "MORNING": (time(0, 0, 0), time(11, 59, 59)),
    "NOON": (time(12, 0, 0), time(16, 59, 59)),
    "EVENING": (time(17, 0, 0), time(23, 59, 59)),
}


def is_within_valid_window(mission_slot: str, server_time: datetime) -> bool:
    """서버 수신 시각이 미션 슬롯의 유효 시간대 안인지 확인한다.

    알 수 없는 슬롯 값이 들어오면 안전하게 실패(False) 처리한다 —
    "모르면 통과"가 아니라 "모르면 막는다" 원칙.
    """
    window = MISSION_SLOT_WINDOWS.get(mission_slot)
    if window is None:
        return False
    start, end = window
    return start <= server_time.time() <= end


# ---------------------------------------------------------------------------
# 18.4 일일 AI 판정 호출 횟수 제한
# ---------------------------------------------------------------------------
#
# 계산 근거: 하루 최대 미션 3개 * 미션당 총 시도 상한 6회
# (judgment_policy.py의 TOTAL_ATTEMPTS_CAP 참고) = 정상 사용 시 최대 18회.
# 여기에 약간의 여유를 두고 20으로 설정했다. 실제 OpenAI 비용을 보고
# 조정할 것 — 이 숫자가 너무 타이트하면 정상 사용자가 막히고,
# 너무 크면 비용 방어선으로서 의미가 없어진다.
DAILY_JUDGEMENT_CALL_LIMIT = 20


def today_key(server_time: datetime) -> str:
    """DB 키로 쓸 날짜 문자열 (YYYY-MM-DD, 서버 시각 기준)."""
    return server_time.strftime("%Y-%m-%d")


def has_exceeded_daily_limit(current_count: int) -> bool:
    """현재까지의 호출 횟수가 일일 상한을 이미 넘겼는지 확인한다.

    db.py에서 get_daily_judgement_count()로 조회한 값을 그대로 넣으면 된다.
    """
    return current_count >= DAILY_JUDGEMENT_CALL_LIMIT
