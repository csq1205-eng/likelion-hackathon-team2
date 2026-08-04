from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Criterion(BaseModel):
    id: str
    met: bool


class VerdictResponse(BaseModel):
    """BE A와 확정한 판정 스키마.

    기존 필수 필드(mission_id ~ processed_at)는 그대로 유지하고,
    임계값 정책 도입에 따른 진단용 필드만 기본값이 있는 선택 필드로 추가했다.
    -> BE A는 기존 파싱 코드를 고치지 않아도 된다.
    """
    mission_id: str
    clip_id: str
    verdict: Literal["pass", "hold", "fail", "error"]  # 임계값 정책 적용 후 최종 판정. error는 재시도 불가능한 시스템 오류로 판정 자체가 불가했던 경우
    confidence: float
    criteria: List[Criterion]
    model_notes: str  # 내부 디버깅/BE A 판정근거생성용. 사용자에게 직접 노출하지 않음
    processed_at: str

    # --- 이하 선택 필드 (평가셋 튜닝/디버깅용, BE A는 무시해도 됨) ---
    raw_verdict: Optional[Literal["pass", "hold", "fail"]] = None  # 모델 원본 판정
    policy_version: Optional[str] = None                           # 적용된 임계값 정책 버전
    policy_note: Optional[str] = None                              # 임계값에 의해 바뀐 이유


class ClipCriterion(BaseModel):
    """미션 정의에 딸린 판정 기준. 업로드 시 함께 넘기면 프롬프트에 주입된다."""
    id: str = Field(..., description="집계 가능한 고정 ID (예: cup_visible)")
    description: str = Field(..., description="모델이 확인해야 할 관찰 사실")
