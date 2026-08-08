from app.schemas.highlight import HighlightCompleteRequest, HighlightCompleteResponse
from app.services.callback_service import HighlightCallbackService


class HighlightService:
    def __init__(self, callback_service=None):
        self.callback_service = callback_service or HighlightCallbackService()

    async def complete(self, request: HighlightCompleteRequest) -> HighlightCompleteResponse:
        # 실제 영상 생성기가 붙으면 '최종 영상 저장 성공' 직후 이 메서드를 호출한다.
        for clip_id in request.clip_ids:
            await self.callback_service.notify_highlight_complete(
                clip_id=clip_id,
            )

        return HighlightCompleteResponse(
            highlight_id=request.highlight_id,
            notified_clip_ids=request.clip_ids,
            status="callbacks_completed",
        )
