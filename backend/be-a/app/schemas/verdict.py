from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field

from app.schemas.common import ApiModel


class VerdictCriterion(ApiModel):
    id: str = Field(min_length=1, max_length=100)
    met: bool
    description: Optional[str] = Field(default=None, max_length=300)


class VerdictReasonRequest(ApiModel):
    mission_id: int = Field(gt=0)
    clip_id: int = Field(gt=0)
    verdict: Literal["PASS", "FAIL", "HOLD", "ERROR"]
    confidence_score: float = Field(ge=0.0, le=100.0)
    criteria: List[VerdictCriterion] = Field(default_factory=list)
    model_notes: str = Field(default="", max_length=2000)
    processed_at: datetime
    mission_title: Optional[str] = Field(default=None, max_length=200)


class VerdictReasonResponse(ApiModel):
    mission_id: int
    clip_id: int
    verdict: Literal["PASS", "FAIL", "HOLD", "ERROR"]
    reason: str
    reason_source: Literal["AI", "FALLBACK"]
