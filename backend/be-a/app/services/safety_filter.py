from dataclasses import dataclass, field

from app.schemas.mission import Mission, MissionGenerateRequest


@dataclass
class FilterResult:
    missions: list[Mission]
    safety_reasons: list[str] = field(default_factory=list)
    exclusion_reasons: list[str] = field(default_factory=list)


class SafetyFilter:
    OUTDOOR_CATEGORIES = {"OUTDOOR_ACTIVITY"}
    LOWER_BODY_KEYWORDS = {"달리기", "스쿼트", "점프", "계단", "산책"}

    def build_constraints(self, request: MissionGenerateRequest) -> list[str]:
        constraints = [
            "하루 미션은 최대 {0}개".format(request.max_missions),
            "의료 진단·치료·약물·건강기능식품 추천 금지",
            "각 미션은 짧은 영상으로 행동 여부를 판정할 수 있어야 함",
        ]
        env = request.environment
        if env.fine_dust in {"bad", "very_bad"}:
            constraints.append("미세먼지가 나쁘므로 야외 활동 금지")
        if env.temperature is not None and env.temperature >= 33:
            constraints.append("폭염이므로 야외 활동 금지")
        if any("무릎" in area for area in request.profile.pain_areas):
            constraints.append("무릎 부담 활동(달리기·스쿼트·점프·계단·장시간 걷기) 금지")
        for excluded in request.excluded_missions:
            constraints.append("사용자 제외 미션 금지: {0}".format(excluded))
        return constraints

    def is_safe(self, mission: Mission, request: MissionGenerateRequest) -> bool:
        text = "{0} {1} {2}".format(mission.title, mission.description, mission.mission_type).lower()
        env = request.environment
        outdoor = mission.mission_type == "OUTDOOR_ACTIVITY" or any(
            word in text for word in ("야외", "산책", "달리기")
        )
        if outdoor and env.fine_dust in {"bad", "very_bad"}:
            return False
        if outdoor and env.temperature is not None and env.temperature >= 33:
            return False
        if any("무릎" in area for area in request.profile.pain_areas):
            if any(keyword in text for keyword in self.LOWER_BODY_KEYWORDS):
                return False
        if any(excluded.strip().lower() in text for excluded in request.excluded_missions if excluded.strip()):
            return False
        forbidden = ("진단", "치료", "처방", "복용", "영양제", "건강기능식품")
        return not any(word in text for word in forbidden)

    def apply(self, missions: list[Mission], request: MissionGenerateRequest) -> FilterResult:
        result = list(missions)
        safety_reasons: list[str] = []
        exclusion_reasons: list[str] = []

        env = request.environment
        if env.fine_dust in {"bad", "very_bad"}:
            result = [m for m in result if m.mission_type not in self.OUTDOOR_CATEGORIES]
            safety_reasons.append("미세먼지가 나빠 야외 활동을 제외함")

        if env.temperature is not None and env.temperature >= 33:
            result = [m for m in result if m.mission_type not in self.OUTDOOR_CATEGORIES]
            safety_reasons.append("폭염 환경으로 야외 활동을 제외함")

        if env.uv_index is not None and env.uv_index >= 6:
            safety_reasons.append("자외선 지수가 높아 자외선 관리 미션을 우선함")

        if any("무릎" in area for area in request.profile.pain_areas):
            result = [
                m for m in result
                if not any(keyword in m.title for keyword in self.LOWER_BODY_KEYWORDS)
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
