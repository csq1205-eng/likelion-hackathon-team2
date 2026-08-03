"""
retention_policy.should_purge() 동작 검증.
pytest 없이 그냥 python으로 돌아가도록 assert만 사용.

실행: python3 tests/test_retention_policy.py
"""
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from retention_policy import should_purge


def make_row(hours_ago: float, shared: bool, highlight_generated: bool, deleted: bool = False,
             share_decided: bool = True):
    return {
        "judgment_completed_at": (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat(),
        "shared": int(shared),
        "highlight_generated": int(highlight_generated),
        "deleted": int(deleted),
        "share_decided": int(share_decided),
    }


def test_not_shared_highlight_done_purges_immediately():
    # share_decided=True (기본값)이므로 유예 없이 바로 파기된다.
    row = make_row(hours_ago=0.1, shared=False, highlight_generated=True)
    assert should_purge(row) is True


def test_not_shared_highlight_done_awaits_share_decision():
    # 사용자가 아직 공유 여부를 선택하지 않았으면 유예 시간(기본 10분) 동안 기다린다.
    row = make_row(hours_ago=0.1, shared=False, highlight_generated=True, share_decided=False)
    assert should_purge(row) is False


def test_not_shared_highlight_pending_waits():
    row = make_row(hours_ago=0.1, shared=False, highlight_generated=False)
    assert should_purge(row) is False


def test_shared_within_24h_waits_for_user_deletion():
    row = make_row(hours_ago=5, shared=True, highlight_generated=True)
    assert should_purge(row) is False


def test_shared_past_24h_hard_cap_purges():
    row = make_row(hours_ago=25, shared=True, highlight_generated=True)
    assert should_purge(row) is True


def test_already_deleted_is_skipped():
    row = make_row(hours_ago=25, shared=True, highlight_generated=True, deleted=True)
    assert should_purge(row) is False


if __name__ == "__main__":
    tests = [v for k, v in globals().items() if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 테스트 전부 통과")
