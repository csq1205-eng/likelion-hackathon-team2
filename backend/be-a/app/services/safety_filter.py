from dataclasses import dataclass, field

from app.schemas.mission import Mission, MissionGenerateRequest
from app.services.mission_policy import FileMissionPolicyRepository


@dataclass
class FilterResult:
    missions: list[Mission]
    safety_reasons: list[str] = field(default_factory=list)
    exclusion_reasons: list[str] = field(default_factory=list)


class SafetyFilter:
    def __init__(self, policy_repository=None) -> None:
        repository = policy_repository or FileMissionPolicyRepository()
        self.rules = repository.get_active()

    def build_constraints(self, request: MissionGenerateRequest) -> list[str]:
        constraints = [
            self.rules.max_daily_missions_template.format(max_missions=request.max_missions),
            *self.rules.base_constraints,
        ]
        env = request.environment
        if env.fine_dust in self.rules.fine_dust_blocking_levels:
            constraints.append("미세먼지가 나쁘므로 야외 활동 금지")
        if env.temperature is not None and env.temperature >= self.rules.heat_threshold_celsius:
            constraints.append("폭염이므로 야외 활동 금지")
        if any("무릎" in area for area in request.profile.pain_areas):
            constraints.append("무릎 부담 활동(달리기·스쿼트·점프·계단·장시간 걷기) 금지")
        for excluded in request.excluded_missions:
            constraints.append("사용자 제외 미션 금지: {0}".format(excluded))
        return constraints

    def is_safe(self, mission: Mission, request: MissionGenerateRequest) -> bool:
        text = "{0} {1} {2}".format(mission.title, mission.description, mission.mission_type).lower()
        env = request.environment
        outdoor = mission.mission_type in self.rules.outdoor_mission_types or any(
            word in text for word in self.rules.outdoor_keywords
        )
        if outdoor and env.fine_dust in self.rules.fine_dust_blocking_levels:
            return False
        if outdoor and env.temperature is not None and env.temperature >= self.rules.heat_threshold_celsius:
            return False
        if any("무릎" in area for area in request.profile.pain_areas):
            if any(keyword in text for keyword in self.rules.lower_body_keywords):
                return False
        if any(excluded.strip().lower() in text for excluded in request.excluded_missions if excluded.strip()):
            return False
        return not any(word in text for word in self.rules.forbidden_keywords)

    def apply(self, missions: list[Mission], request: MissionGenerateRequest) -> FilterResult:
        result = list(missions)
        safety_reasons: list[str] = []
        exclusion_reasons: list[str] = []

        env = request.environment
        if env.fine_dust in self.rules.fine_dust_blocking_levels:
            result = [m for m in result if m.mission_type not in self.rules.outdoor_mission_types]
            safety_reasons.append("미세먼지가 나빠 야외 활동을 제외함")

        if env.temperature is not None and env.temperature >= self.rules.heat_threshold_celsius:
            result = [m for m in result if m.mission_type not in self.rules.outdoor_mission_types]
            safety_reasons.append("폭염 환경으로 야외 활동을 제외함")

        if env.uv_index is not None and env.uv_index >= self.rules.high_uv_threshold:
            safety_reasons.append("자외선 지수가 높아 자외선 관리 미션을 우선함")

        if any("무릎" in area for area in request.profile.pain_areas):
            result = [
                m for m in result
                if not any(keyword in m.title for keyword in self.rules.lower_body_keywords)
            ]
            safety_reasons.append("무릎 통증 기록을 반영해 하체 부담 활동을 제외함")

        excluded = [text.strip().lower() for text in request.excluded_missions if text.strip()]
        if excluded:
            result = [
                m for m in result
                if not any(text in m.title.lower() or text == m.mission_type.lower() for text in excluded)
            ]
            exclusion_reasons.extend(request.excluded_missions)

        return FilterResult(result, safety_reasons, exclusion_reasons)
