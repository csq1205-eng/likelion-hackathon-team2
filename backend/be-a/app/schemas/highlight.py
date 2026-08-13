from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, ExternalId


class HighlightCompleteRequest(ApiModel):
    highlight_id: int = Field(gt=0)
    clip_ids: List[ExternalId] = Field(min_length=1, max_length=100)
    completed_at: datetime

    @model_validator(mode="after")
    def validate_unique_clip_ids(self):
        if len(self.clip_ids) != len(set(self.clip_ids)):
            raise ValueError("clipIds는 중복될 수 없습니다.")
        return self


class HighlightCompleteResponse(ApiModel):
    highlight_id: int
    notified_clip_ids: List[ExternalId]
    failed_clip_ids: List[ExternalId] = Field(default_factory=list)
    status: Literal["COMPLETED", "PARTIAL", "FAILED"]


class HighlightClip(ApiModel):
    clip_id: ExternalId
    shared: bool
    source_url: Optional[str] = Field(default=None, max_length=2000)
    caption: str = Field(default="오늘의 미션 완료", min_length=1, max_length=80)

    @model_validator(mode="after")
    def validate_shared_clip_source(self):
        if self.shared and not self.source_url:
            raise ValueError("공유 클립에는 sourceUrl이 필요합니다.")
        return self


class HighlightGenerateRequest(ApiModel):
    highlight_id: int = Field(gt=0)
    group_id: int = Field(gt=0)
    title: str = Field(default="오늘의 W 하이라이트", min_length=1, max_length=100)
    clips: List[HighlightClip] = Field(min_length=1, max_length=6)
    max_duration_seconds: int = Field(default=30, ge=5, le=30)

    @model_validator(mode="after")
    def validate_unique_clip_ids(self):
        clip_ids = [clip.clip_id for clip in self.clips]
        if len(clip_ids) != len(set(clip_ids)):
            raise ValueError("clips의 clipId는 중복될 수 없습니다.")
        return self


class HighlightGenerateResponse(ApiModel):
    highlight_id: int
    group_id: int
    status: Literal["COMPLETED"]
    video_url: str
    duration_seconds: float = Field(gt=0, le=30.5)
    notified_clip_ids: List[ExternalId]
    failed_clip_ids: List[ExternalId] = Field(default_factory=list)
    callback_status: Literal["COMPLETED", "PARTIAL", "FAILED", "SKIPPED"]
