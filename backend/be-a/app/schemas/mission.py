from typing import List, Literal, Optional

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, ExternalId


MissionSlot = Literal["MORNING", "NOON", "EVENING"]
MissionType = Literal[
    "HYDRATION",
    "SUN_CARE",
    "MOISTURIZING",
    "CLEANSING",
    "INDOOR_ACTIVITY",
    "OUTDOOR_ACTIVITY",
    "SLEEP",
    "STRESS_RELIEF",
]


class UserProfile(ApiModel):
    age: Optional[int] = Field(default=None, ge=13, le=100)
    skin_type: Literal["dry", "oily", "combination", "sensitive", "normal"]
    concerns: List[str] = Field(default_factory=list, max_length=10)
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    habits: List[str] = Field(default_factory=list, max_length=15)
    pain_areas: List[str] = Field(default_factory=list, max_length=10)


class Environment(ApiModel):
    weather: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=-50, le=60)
    uv_index: Optional[float] = Field(default=None, ge=0, le=20)
    fine_dust: Optional[Literal["good", "normal", "bad", "very_bad"]] = None


class MissionGenerateRequest(ApiModel):
    user_id: ExternalId
    goal: str = Field(min_length=1, max_length=300)
    profile: UserProfile
    environment: Environment = Field(default_factory=Environment)
    excluded_missions: List[str] = Field(default_factory=list, max_length=30)
    max_missions: int = Field(default=3, ge=1, le=3)


class VerificationCriterion(ApiModel):
    id: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9_]+$")
    description: str = Field(min_length=1, max_length=200)


class Mission(ApiModel):
    title: str
    description: str
    slot: MissionSlot
    mission_type: MissionType
    difficulty: Literal["easy", "medium"]
    duration_minutes: int = Field(ge=1, le=30)
    reason: str
    verification_criteria: List[VerificationCriterion] = Field(min_length=1, max_length=4)


class AppliedFilters(ApiModel):
    safety: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)


class MissionGenerateResponse(ApiModel):
    user_id: ExternalId
    missions: List[Mission]
    applied_filters: AppliedFilters
    generation_mode: Literal["ai", "fallback"]

    @model_validator(mode="after")
    def validate_mission_count(self):
        if len(self.missions) > 3:
            raise ValueError("하루 미션은 최대 3개입니다.")
        return self
