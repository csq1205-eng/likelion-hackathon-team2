"""
mission_lookup.get_mission() 스캐폴드 계약 검증.
실제 조회 로직은 아직 없다 (승환님 구현 대기). 지금은 "연결 안 됐으면
조용히 넘어가지 않고 확실히 실패한다"는 계약만 확인한다.

실행: python3 test_mission_lookup.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mission_lookup import get_mission


def test_get_mission_raises_until_implemented():
    try:
        get_mission("mission-123")
    except NotImplementedError:
        pass
    else:
        raise AssertionError("get_mission()이 구현되기 전까지는 NotImplementedError를 던져야 한다")


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 테스트 전부 통과")
