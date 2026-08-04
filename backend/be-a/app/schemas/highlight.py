from datetime import datetime
from typing import List

from pydantic import Field

from app.schemas.common import ApiModel


class HighlightCompleteRequest(ApiModel):
    highlight_id: int = Field(gt=0)
    clip_ids: List[int] = Field(min_length=1, max_length=100)
    completed_at: datetime


class HighlightCompleteResponse(ApiModel):
    highlight_id: int
    notified_clip_ids: List[int]
    status: str
