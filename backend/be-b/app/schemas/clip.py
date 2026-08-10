from datetime import datetime
from typing import ClassVar, FrozenSet, List, Literal, Optional

from pydantic import Field

from app.schemas.common import ApiModel

JudgementResult = Literal["PASS", "FAIL", "HOLD", "ERROR"]
JudgementStatus = Literal["REQUESTED", "PROCESSING", "COMPLETED", "FAILED"]
RetentionPolicy = Literal["KEEP_UNTIL_HIGHLIGHT_COMPLETE", "KEEP_24_HOURS"]


class ShareUpdateRequest(ApiModel):
    shared: bool


class WithdrawalCleanupRequest(ApiModel):
    user_id: int = Field(gt=0)
    withdrawal_id: int = Field(gt=0)
    requested_at: Optional[datetime] = None


class ClipUploadResponse(ApiModel):
    """POST /api/clips/upload 응답. 명세서 12.1, 12.4를 하나의 모델로 통합한다.

    - 200 OK(동기 판정 완료): result/reason/confidenceScore 등이 채워진다.
    - 202 Accepted(지연 처리): judgementStatus=PROCESSING이고 result/reason은 null,
      pollingIntervalSeconds가 채워진다.
    - 재촬영(attemptNo > 1)일 때만 retryCount/maxRetryCount/remainingRetryCount를 채운다.
    """

    _omit_if_none: ClassVar[FrozenSet[str]] = frozenset(
        {"retryCount", "maxRetryCount", "remainingRetryCount", "pollingIntervalSeconds"}
    )

    mission_id: int
    clip_id: int
    source_clip_url: Optional[str] = None
    attempt_no: int
    retry_count: Optional[int] = None
    max_retry_count: Optional[int] = None
    remaining_retry_count: Optional[int] = None
    frame_count: int
    shared: bool
    judgement_request_id: int
    judgement_status: JudgementStatus
    result: Optional[JudgementResult] = None
    reason: Optional[str] = None
    confidence_score: Optional[float] = None
    prompt_version: Optional[str] = None
    model_version: Optional[str] = None
    judged_at: Optional[datetime] = None
    retention_policy: Optional[RetentionPolicy] = None
    retention_expires_at: Optional[datetime] = None
    polling_interval_seconds: Optional[int] = None


class ClipResultResponse(ApiModel):
    """GET /api/clips/{clipId}/result 응답 (명세서 12.3)."""

    _omit_if_none: ClassVar[FrozenSet[str]] = frozenset({"pollingIntervalSeconds"})

    mission_id: int
    clip_id: int
    attempt_no: int
    status: JudgementStatus
    result: Optional[JudgementResult] = None
    reason: Optional[str] = None
    confidence_score: Optional[float] = None
    prompt_version: Optional[str] = None
    model_version: Optional[str] = None
    judged_at: Optional[datetime] = None
    polling_interval_seconds: Optional[int] = None


class ShareUpdateResponse(ApiModel):
    """PATCH /api/clips/{clipId}/share 응답.

    명세서에 Response 예시가 없어 형제 API들의 응답 스타일에 맞춰 구성했다.
    """

    clip_id: int
    shared: bool
    share_decided: bool
    retention_policy: RetentionPolicy
    retention_expires_at: Optional[datetime] = None


class HighlightCompleteResponse(ApiModel):
    clip_id: int
    highlight_completed: bool


class DeleteClipResponse(ApiModel):
    clip_id: int
    deleted: bool


class WithdrawalCleanupResponse(ApiModel):
    user_id: int
    withdrawal_id: int
    deleted_clip_count: int
    deleted_frame_count: int
    cleanup_status: Literal["COMPLETED", "NO_CLIPS", "FAILED"]
    idempotent: bool
