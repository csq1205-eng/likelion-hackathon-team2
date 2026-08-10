from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, ExternalId


class VerdictCriterion(ApiModel):
    id: str = Field(min_length=1, max_length=100)
    met: bool
    description: Optional[str] = Field(default=None, max_length=300)


class VerdictReasonRequest(ApiModel):
    mission_id: ExternalId
    clip_id: ExternalId
    verdict: Literal["PASS", "FAIL", "HOLD", "ERROR"]
    confidence_score: float = Field(ge=0.0, le=100.0)
    criteria: List[VerdictCriterion] = Field(default_factory=list)
    model_notes: str = Field(default="", max_length=2000)
    processed_at: datetime
    mission_title: Optional[str] = Field(default=None, max_length=200)

    @model_validator(mode="before")
    @classmethod
    def normalize_be_b_payload(cls, data):
        """BE B VerdictResponse를 별도 변환 없이 받을 수 있게 계약을 정규화한다.

        BE A의 기존 camelCase/백분율 계약도 그대로 유지한다.
        """
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        verdict = normalized.get("verdict")
        if isinstance(verdict, str):
            normalized["verdict"] = verdict.upper()

        has_percentage = "confidenceScore" in normalized or "confidence_score" in normalized
        if not has_percentage and "confidence" in normalized:
            confidence = normalized.pop("confidence")
            try:
                normalized["confidence_score"] = float(confidence) * 100.0
            except (TypeError, ValueError):
                normalized["confidence_score"] = confidence

        return normalized


class VerdictReasonResponse(ApiModel):
    mission_id: ExternalId
    clip_id: ExternalId
    verdict: Literal["PASS", "FAIL", "HOLD", "ERROR"]
    reason: str
    reason_source: Literal["AI", "FALLBACK"]
