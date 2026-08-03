"""
비전 모델의 원본 판정(raw verdict)을 최종 판정으로 바꾸는 임계값 정책.

이 파일이 존재하는 이유:
모델이 confidence 0.3으로 "pass"라고 해도 그대로 통과시키면 판정 품질을 조절할 방법이 없다.
평가셋(~65개 클립) 벤치마크에서 조정할 노브를 여기 한 곳에 모아두고,
POLICY_VERSION을 올려가며 "오탐율 X% -> Y%"를 측정한다.
"""
from typing import List, Tuple

from models import Criterion

POLICY_VERSION = "v1"

# 이 값 미만의 confidence로 나온 pass는 통과시키지 않고 hold(재촬영 유도)로 내린다.
PASS_CONFIDENCE_THRESHOLD = 0.60

# 이 값 미만의 confidence로 나온 fail은 사용자에게 페널티를 주지 않고 hold로 내린다.
# (재촬영 횟수 차감은 fail에서만 일어나므로, 애매한 fail을 hold로 돌리면 오탐 페널티가 줄어든다)
FAIL_CONFIDENCE_THRESHOLD = 0.60

# 미션 정의에 criteria가 명시된 경우, 전부 충족해야 pass로 인정할지 여부.
REQUIRE_ALL_CRITERIA = True


def _clamp(value: float) -> float:
    try:
        value = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, value))


def apply(
    raw_verdict: str,
    confidence: float,
    criteria: List[Criterion],
    criteria_enforced: bool = False,
) -> Tuple[str, float, str]:
    """(최종 판정, 정규화된 confidence, 변경 사유) 반환.

    criteria_enforced: 미션 정의에서 내려온 고정 criteria를 쓴 경우에만 True.
                       모델이 즉석에서 지어낸 criteria로는 pass를 막지 않는다.
    """
    confidence = _clamp(confidence)

    if raw_verdict == "pass":
        if confidence < PASS_CONFIDENCE_THRESHOLD:
            return "hold", confidence, (
                f"confidence {confidence:.2f} < pass 임계값 {PASS_CONFIDENCE_THRESHOLD}"
            )
        if REQUIRE_ALL_CRITERIA and criteria_enforced and criteria:
            unmet = [c.id for c in criteria if not c.met]
            if unmet:
                return "hold", confidence, f"미충족 기준: {', '.join(unmet)}"
        return "pass", confidence, ""

    if raw_verdict == "fail":
        if confidence < FAIL_CONFIDENCE_THRESHOLD:
            return "hold", confidence, (
                f"confidence {confidence:.2f} < fail 임계값 {FAIL_CONFIDENCE_THRESHOLD}"
            )
        return "fail", confidence, ""

    return "hold", confidence, ""
