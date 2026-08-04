import asyncio
from datetime import datetime, timezone

from app.schemas.highlight import HighlightCompleteRequest
from app.services.highlight_service import HighlightService


class FakeCallbackService:
    def __init__(self):
        self.calls = []

    async def notify_highlight_complete(self, clip_id):
        self.calls.append(clip_id)
        return {"clip_id": clip_id, "purged": True}


def test_callback_is_sent_for_each_clip():
    callback = FakeCallbackService()
    service = HighlightService(callback_service=callback)
    request = HighlightCompleteRequest(
        highlight_id=500,
        clip_ids=[1, 2],
        completed_at=datetime(2026, 8, 3, 12, 30, tzinfo=timezone.utc),
    )

    result = asyncio.run(service.complete(request))

    assert result.status == "callbacks_completed"
    assert callback.calls == [1, 2]
