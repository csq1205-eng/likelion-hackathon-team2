import logging

from app.schemas.verdict import VerdictReasonRequest, VerdictReasonResponse
from app.services.llm_service import LLMService


logger = logging.getLogger(__name__)


CRITERIA_LABELS = {
    "product_visible": "제품",
    "application_action": "제품을 바르는 모습",
    "person_visible": "미션을 수행하는 모습",
    "duration_met": "필요한 촬영 시간",
    "drinking_action": "물을 마시는 모습",
}


class VerdictService:
    """내부 model_notes를 노출하지 않고 판정 결과를 사용자 문장으로 변환한다."""

    def __init__(self, llm_service=None) -> None:
        self.llm_service = llm_service or LLMService()

    def create_user_reason(self, request: VerdictReasonRequest) -> VerdictReasonResponse:
        if self.llm_service.available:
            try:
                message = self.llm_service.generate_verdict_reason(request).strip()
                notes_leaked = bool(request.model_notes and request.model_notes in message)
                if message and not notes_leaked:
                    return VerdictReasonResponse(
                        mission_id=request.mission_id,
                        clip_id=request.clip_id,
                        verdict=request.verdict,
                        reason=message,
                        reason_source="AI",
                    )
            except Exception:
                # AI 장애가 판정 결과 전달 실패로 이어지지 않도록 규칙 문장으로 대체한다.
                logger.exception("OpenAI 판정 이유 생성에 실패해 fallback 문장을 사용합니다.")

        failed_labels = [
            criterion.description or CRITERIA_LABELS.get(criterion.id, "일부 수행 조건")
            for criterion in request.criteria
            if not criterion.met
        ]
        failed = failed_labels[0] if failed_labels else "일부 수행 조건"

        if request.verdict == "PASS":
            message = "미션 수행이 확인되어 인증이 완료됐어요."
        elif request.verdict == "FAIL":
            message = (
                f"영상에서 '{failed}' 조건이 확인되지 않아 인증되지 않았어요. "
                "안내된 수행 조건을 확인한 뒤 다시 촬영해 주세요."
            )
        elif request.verdict == "HOLD":
            message = (
                f"영상에서 '{failed}' 조건을 명확하게 확인하기 어려웠어요. "
                "해당 장면이 잘 보이도록 다시 촬영해 주세요."
            )
        else:
            message = "AI 판정 중 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."

        return VerdictReasonResponse(
            mission_id=request.mission_id,
            clip_id=request.clip_id,
            verdict=request.verdict,
            reason=message,
            reason_source="FALLBACK",
        )
