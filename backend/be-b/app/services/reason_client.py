from datetime import datetime, timezone
from typing import List, Optional, Tuple

import httpx

from app.config import settings
from app.services.vision_service import VisionCriterion

_CRITERIA_LABELS = {
    "product_visible": "제품",
    "application_action": "동작 수행",
    "person_visible": "미션을 수행하는 모습",
}

_TIMEOUT_SEC = 10.0


def _fallback_reason(verdict: str, criteria: List[VisionCriterion]) -> str:
    failed = next(
        (c.description or _CRITERIA_LABELS.get(c.id, "일부 수행 조건") for c in criteria if not c.met),
        "일부 수행 조건",
    )
    if verdict == "PASS":
        return "미션 수행이 확인되어 인증이 완료됐어요."
    if verdict == "FAIL":
        return (
            f"영상에서 '{failed}' 조건이 확인되지 않아 인증되지 않았어요. "
            "안내된 수행 조건을 확인한 뒤 다시 촬영해 주세요."
        )
    if verdict == "HOLD":
        return (
            f"영상에서 '{failed}' 조건을 명확하게 확인하기 어려웠어요. "
            "해당 장면이 잘 보이도록 다시 촬영해 주세요."
        )
    return "AI 판정 중 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."


class ReasonClient:
    """BE A의 POST /api/ai/verdicts/reason 을 호출해 사용자용 판정 이유 문장을 받아온다.

    BE A README에 명시된 계약: BE B가 판정 결과(verdict/confidence/criteria)를 넘기면
    BE A가 자연스러운 한국어 문장으로 변환해 돌려준다. BE A 호출이 불가능하면
    BE A의 VerdictService와 동일한 규칙 기반 fallback 문장을 사용한다.
    """

    def __init__(self, base_url: Optional[str] = None, client: Optional[httpx.Client] = None):
        self.base_url = (base_url if base_url is not None else settings.be_a_base_url).rstrip("/")
        self._client = client

    def get_reason(
        self,
        mission_id: int,
        clip_id: int,
        verdict: str,
        confidence_score: float,
        criteria: List[VisionCriterion],
        model_notes: str,
        mission_title: Optional[str] = None,
    ) -> Tuple[str, str]:
        """(reason, reason_source) 튜플을 반환한다. reason_source는 AI 또는 FALLBACK."""
        if not self.base_url:
            return _fallback_reason(verdict, criteria), "FALLBACK"

        body = {
            "missionId": mission_id,
            "clipId": clip_id,
            "verdict": verdict,
            "confidenceScore": confidence_score,
            "criteria": [c.model_dump(by_alias=False) for c in criteria],
            "modelNotes": model_notes,
            "processedAt": datetime.now(timezone.utc).isoformat(),
            "missionTitle": mission_title,
        }

        owns_client = self._client is None
        client = self._client or httpx.Client(timeout=_TIMEOUT_SEC)
        try:
            response = client.post(f"{self.base_url}/api/ai/verdicts/reason", json=body)
            response.raise_for_status()
            data = response.json()
            reason = data.get("reason")
            if reason:
                return reason, data.get("reasonSource", "AI")
        except (httpx.HTTPError, ValueError):
            pass
        finally:
            if owns_client:
                client.close()

        return _fallback_reason(verdict, criteria), "FALLBACK"
