"""
abuse_policy.py 테스트 (18.3 시간대 검증 / 18.4 일일 호출 제한)

DB나 FastAPI 앱 없이 순수 함수만 테스트하므로 바로 실행 가능하다.

실행:
    python3 tests/test_abuse_policy.py
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from abuse_policy import (
    is_within_valid_window,
    has_exceeded_daily_limit,
    today_key,
    DAILY_JUDGEMENT_CALL_LIMIT,
)

# --- 1. 슬롯 시간대 안쪽 제출 ---
assert is_within_valid_window("MORNING", datetime(2026, 8, 4, 8, 0, 0)) is True
assert is_within_valid_window("NOON", datetime(2026, 8, 4, 14, 30, 0)) is True
assert is_within_valid_window("EVENING", datetime(2026, 8, 4, 20, 0, 0)) is True
print("PASS 1: 슬롯 시간대 안쪽 제출은 통과")

# --- 2. 슬롯 시간대 바깥 제출 ---
assert is_within_valid_window("MORNING", datetime(2026, 8, 4, 15, 0, 0)) is False
assert is_within_valid_window("EVENING", datetime(2026, 8, 4, 3, 0, 0)) is False
print("PASS 2: 슬롯 시간대 바깥 제출은 차단")

# --- 3. 경계값 (자정, 슬롯 경계 직전/직후) ---
assert is_within_valid_window("MORNING", datetime(2026, 8, 4, 0, 0, 0)) is True
assert is_within_valid_window("MORNING", datetime(2026, 8, 4, 11, 59, 59)) is True
assert is_within_valid_window("NOON", datetime(2026, 8, 4, 12, 0, 0)) is True
assert is_within_valid_window("EVENING", datetime(2026, 8, 4, 23, 59, 59)) is True
print("PASS 3: 슬롯 경계값 정상 처리")

# --- 4. 알 수 없는 슬롯 값 -> 안전하게 차단 ---
assert is_within_valid_window("MIDNIGHT_SNACK", datetime(2026, 8, 4, 8, 0, 0)) is False
assert is_within_valid_window("", datetime(2026, 8, 4, 8, 0, 0)) is False
print("PASS 4: 알 수 없는 슬롯은 차단 (모르면 막는다)")

# --- 5. 일일 호출 횟수 제한 ---
assert has_exceeded_daily_limit(0) is False
assert has_exceeded_daily_limit(DAILY_JUDGEMENT_CALL_LIMIT - 1) is False
assert has_exceeded_daily_limit(DAILY_JUDGEMENT_CALL_LIMIT) is True
assert has_exceeded_daily_limit(DAILY_JUDGEMENT_CALL_LIMIT + 5) is True
print(f"PASS 5: 일일 호출 상한({DAILY_JUDGEMENT_CALL_LIMIT}회) 경계값 정상 처리")

# --- 6. 날짜 키 포맷 ---
assert today_key(datetime(2026, 8, 4, 23, 59, 59)) == "2026-08-04"
assert today_key(datetime(2026, 1, 1, 0, 0, 0)) == "2026-01-01"
print("PASS 6: 날짜 키 포맷 YYYY-MM-DD 확인")

print("\n전체 통과: abuse_policy.py 6개 테스트 그룹 전부 성공")
