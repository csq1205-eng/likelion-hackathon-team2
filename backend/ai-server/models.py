from pydantic import BaseModel
from typing import List, Literal


class Criterion(BaseModel):
    id: str
    met: bool


class VerdictResponse(BaseModel):
    mission_id: str
    clip_id: str
    verdict: Literal["pass", "hold", "fail"]
    confidence: float
    criteria: List[Criterion]
    model_notes: str  # 내부 디버깅/BE A 판정근거생성용. 사용자에게 직접 노출하지 않음
    processed_at: str
