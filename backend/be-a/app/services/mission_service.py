import logging
from copy import deepcopy

from app.schemas.mission import (
    AppliedFilters,
    Mission,
    MissionGenerateRequest,
    MissionGenerateResponse,
)
from app.services.mission_catalog import MISSION_CATALOG
from app.services.safety_filter import SafetyFilter
from app.services.llm_service import LLMService


logger = logging.getLogger(__name__)


class MissionService:
    def __init__(self, llm_service=None) -> None:
        self.safety_filter = SafetyFilter()
        self.llm_service = llm_service or LLMService()

    def generate(self, request: MissionGenerateRequest) -> MissionGenerateResponse:
        safety_constraints = self.safety_filter.build_constraints(request)

        if self.llm_service.available:
            try:
                ai_missions = self.llm_service.generate_missions(request, safety_constraints)
                safe_missions = [
                    mission for mission in ai_missions
                    if self.safety_filter.is_safe(mission, request)
                ]
                if safe_missions:
                    safety_filters = [
                        constraint for constraint in safety_constraints
                        if not constraint.startswith("사용자 제외 미션 금지:")
                    ]
                    return MissionGenerateResponse(
                        user_id=request.user_id,
                        missions=safe_missions[: request.max_missions],
                        applied_filters=AppliedFilters(
                            safety=safety_filters,
                            exclusions=request.excluded_missions,
                        ),
                        generation_mode="ai",
                    )
            except Exception:
                # API 장애나 스키마 오류가 사용자 요청 실패로 이어지지 않도록 기본 미션으로 대체한다.
                logger.exception("OpenAI 미션 생성에 실패해 fallback 미션을 사용합니다.")

        filtered = self.safety_filter.apply(MISSION_CATALOG, request)
        ranked = sorted(
            (self._personalize(deepcopy(mission), request) for mission in filtered.missions),
            key=lambda mission: self._score(mission, request),
            reverse=True,
        )

        selected = self._spread_time_slots(ranked, request.max_missions)
        return MissionGenerateResponse(
            user_id=request.user_id,
            missions=selected,
            applied_filters=AppliedFilters(
                safety=filtered.safety_reasons,
                exclusions=filtered.exclusion_reasons,
            ),
            generation_mode="fallback",
        )

    @staticmethod
    def _score(mission: Mission, request: MissionGenerateRequest) -> int:
        score = 0
        concerns = " ".join(request.profile.concerns)
        goal = request.goal

        if mission.mission_type == "MOISTURIZING" and any(k in concerns for k in ("건조", "각질", "수분")):
            score += 5
        if mission.mission_type == "CLEANSING" and any(k in concerns for k in ("피지", "여드름", "트러블")):
            score += 5
        if mission.mission_type == "SUN_CARE" and (
            (request.environment.uv_index or 0) >= 6 or any(k in concerns for k in ("색소", "기미"))
        ):
            score += 6
        if mission.mission_type == "HYDRATION" and any(k in goal + concerns for k in ("피부", "수분", "건강")):
            score += 3
        if mission.mission_type == "INDOOR_ACTIVITY" and (request.profile.sleep_hours or 8) < 7:
            score += 2
        return score

    @staticmethod
    def _personalize(mission: Mission, request: MissionGenerateRequest) -> Mission:
        concerns = " ".join(request.profile.concerns)
        uv = request.environment.uv_index

        if mission.mission_type == "SUN_CARE" and uv is not None and uv >= 6:
            mission.reason = f"오늘 자외선 지수가 {uv:g}로 높아 피부 노출을 줄일 수 있도록 추천했어요."
        elif mission.mission_type == "MOISTURIZING" and any(k in concerns for k in ("건조", "각질", "수분")):
            mission.reason = "건조함과 수분 부족 고민을 반영해 저녁 보습 미션을 추천했어요."
        elif mission.mission_type == "CLEANSING" and any(k in concerns for k in ("피지", "여드름", "트러블")):
            mission.reason = "피지와 트러블 고민을 반영해 자극적이지 않은 세안 습관을 추천했어요."
        elif mission.mission_type == "INDOOR_ACTIVITY" and (request.profile.sleep_hours or 8) < 7:
            mission.reason = "최근 수면 시간이 짧아 몸의 긴장을 풀고 수면을 준비할 수 있는 미션을 추천했어요."
        return mission

    @staticmethod
    def _spread_time_slots(missions: list[Mission], count: int) -> list[Mission]:
        selected: list[Mission] = []
        used_slots: set[str] = set()
        for mission in missions:
            if mission.slot not in used_slots:
                selected.append(mission)
                used_slots.add(mission.slot)
            if len(selected) == count:
                return selected

        for mission in missions:
            if mission not in selected:
                selected.append(mission)
            if len(selected) == count:
                break
        return selected
