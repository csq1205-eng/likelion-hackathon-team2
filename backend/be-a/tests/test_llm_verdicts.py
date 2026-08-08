from app.schemas.verdict import VerdictReasonRequest
from app.services.verdict_service import VerdictService


class FakeVerdictLLMService:
    available = True

    def generate_verdict_reason(self, request):
        return "제품은 확인됐지만 바르는 모습이 선명하지 않았어요. 해당 장면이 잘 보이도록 다시 촬영해 주세요."


def test_ai_verdict_reason_is_returned_without_internal_notes():
    service = VerdictService(llm_service=FakeVerdictLLMService())
    request = VerdictReasonRequest(
        mission_id=100,
        clip_id=200,
        verdict="FAIL",
        confidence_score=72.0,
        criteria=[
            {"id": "product_visible", "met": True},
            {"id": "application_action", "met": False},
        ],
        model_notes="SECRET INTERNAL MODEL NOTE",
        processed_at="2026-08-03T12:30:00Z",
    )

    result = service.create_user_reason(request)

    assert result.reason_source == "AI"
    assert "다시 촬영" in result.reason
    assert "SECRET" not in result.reason


class FailingVerdictLLMService(FakeVerdictLLMService):
    def generate_verdict_reason(self, request):
        raise RuntimeError("temporary AI error")


def test_ai_error_uses_rule_based_fallback():
    service = VerdictService(llm_service=FailingVerdictLLMService())
    request = VerdictReasonRequest(
        mission_id=100,
        clip_id=200,
        verdict="FAIL",
        confidence_score=91.0,
        criteria=[{"id": "duration_met", "met": False}],
        model_notes="Clip duration was shorter than required.",
        processed_at="2026-08-03T12:30:00Z",
    )

    result = service.create_user_reason(request)

    assert result.reason_source == "FALLBACK"
    assert "필요한 촬영 시간" in result.reason
