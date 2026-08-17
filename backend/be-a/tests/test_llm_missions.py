from app.schemas.mission import Mission, MissionGenerateRequest
from app.services.mission_service import MissionService


class FakeLLMService:
    available = True

    def generate_missions(self, request, safety_constraints):
        return [
            Mission(
                title="점심에 선크림 덧바르기",
                description="점심시간에 선크림을 다시 발라주세요.",
                slot="NOON",
                mission_type="SUN_CARE",
                difficulty="easy",
                duration_minutes=3,
                reason="오늘 자외선이 높아 피부 노출을 줄일 수 있도록 추천했어요.",
                verification_criteria=[
                    {"id": "sunscreen_visible", "description": "선크림 제품이 보여야 함"},
                    {"id": "application_action", "description": "바르는 행동이 보여야 함"},
                ],
            )
        ]


def test_ai_generated_mission_is_returned():
    service = MissionService(llm_service=FakeLLMService())
    request = MissionGenerateRequest(
        user_id="user-ai",
        goal="여름 전에 피부 컨디션 개선",
        profile={
            "age": 24,
            "skin_type": "dry",
            "concerns": ["각질"],
            "habits": ["수면이 불규칙함"],
        },
        environment={"uv_index": 8, "fine_dust": "normal"},
    )

    result = service.generate(request)

    assert result.generation_mode == "ai"
    assert result.missions[0].title == "점심에 선크림 덧바르기"


class UnsafeFakeLLMService(FakeLLMService):
    def generate_missions(self, request, safety_constraints):
        mission = super().generate_missions(request, safety_constraints)[0]
        mission.title = "미세먼지 속에서 야외 달리기"
        mission.mission_type = "OUTDOOR_ACTIVITY"
        return [mission]


def test_unsafe_ai_result_uses_fallback():
    service = MissionService(llm_service=UnsafeFakeLLMService())
    request = MissionGenerateRequest(
        user_id="user-safe",
        goal="피부와 생활 습관 개선",
        profile={"skin_type": "normal"},
        environment={"fine_dust": "bad"},
    )

    result = service.generate(request)

    assert result.generation_mode == "fallback"
    assert all(m.mission_type != "OUTDOOR_ACTIVITY" for m in result.missions)
