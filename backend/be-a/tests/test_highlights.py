import asyncio
from datetime import date, datetime, timezone

import httpx
import pytest
from pydantic import ValidationError

from app.schemas.highlight import HighlightCompleteRequest, HighlightGenerateRequest
from app.services.highlight_service import HighlightService
from app.services.highlight_storage_service import HighlightStorageError


class FakeCallbackService:
    def __init__(self):
        self.calls = []

    async def notify_highlight_complete(self, clip_id, highlight_id):
        self.calls.append((highlight_id, clip_id))
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

    assert result.status == "COMPLETED"
    assert result.failed_clip_ids == []
    assert callback.calls == [(500, 1), (500, 2)]


def test_callback_accepts_be_b_uuid_clip_ids():
    callback = FakeCallbackService()
    service = HighlightService(callback_service=callback)
    clip_ids = [
        "83fe9cc1-08f8-4192-9510-ff7866836286",
        "clip-local-test-2",
    ]
    request = HighlightCompleteRequest(
        highlight_id=501,
        clip_ids=clip_ids,
        completed_at=datetime(2026, 8, 10, 12, 30, tzinfo=timezone.utc),
    )

    result = asyncio.run(service.complete(request))

    assert result.notified_clip_ids == clip_ids
    assert callback.calls == [(501, clip_id) for clip_id in clip_ids]


class PartiallyFailingCallbackService(FakeCallbackService):
    async def notify_highlight_complete(self, clip_id, highlight_id):
        self.calls.append((highlight_id, clip_id))
        if clip_id == "clip-fail":
            request = httpx.Request("POST", "http://be-b/api/callback")
            raise httpx.ConnectError("connection failed", request=request)
        return {"clip_id": clip_id, "purged": True}


def test_callback_partial_failure_is_reported_per_clip():
    callback = PartiallyFailingCallbackService()
    service = HighlightService(callback_service=callback)
    request = HighlightCompleteRequest(
        highlight_id=502,
        clip_ids=["clip-ok", "clip-fail", "clip-ok-2"],
        completed_at=datetime(2026, 8, 10, 12, 30, tzinfo=timezone.utc),
    )

    result = asyncio.run(service.complete(request))

    assert result.status == "PARTIAL"
    assert result.notified_clip_ids == ["clip-ok", "clip-ok-2"]
    assert result.failed_clip_ids == ["clip-fail"]


def test_callback_all_failures_are_reported():
    callback = PartiallyFailingCallbackService()
    service = HighlightService(callback_service=callback)
    request = HighlightCompleteRequest(
        highlight_id=503,
        clip_ids=["clip-fail"],
        completed_at=datetime(2026, 8, 10, 12, 30, tzinfo=timezone.utc),
    )

    result = asyncio.run(service.complete(request))

    assert result.status == "FAILED"
    assert result.notified_clip_ids == []
    assert result.failed_clip_ids == ["clip-fail"]


def test_duplicate_callback_clip_ids_are_rejected():
    with pytest.raises(ValidationError):
        HighlightCompleteRequest(
            highlight_id=504,
            clip_ids=["clip-1", "clip-1"],
            completed_at=datetime(2026, 8, 10, 12, 30, tzinfo=timezone.utc),
        )


class FakeGenerator:
    def __init__(self, events):
        self.events = events

    def generate(self, request, source_fetcher):
        self.events.append("video_saved")
        return "/tmp/highlight-505.mp4", 12.0, "http://be-a/highlight-505.mp4"


class OrderedPartialCallbackService(PartiallyFailingCallbackService):
    def __init__(self, events):
        super().__init__()
        self.events = events

    async def notify_highlight_complete(self, clip_id, highlight_id):
        self.events.append("callback:{0}".format(clip_id))
        return await super().notify_highlight_complete(clip_id, highlight_id)


class FakeStorageService:
    def __init__(self, events):
        self.events = events
        self.calls = []

    async def save_highlight(self, **payload):
        self.events.append("metadata_saved")
        self.calls.append(payload)
        return {"highlightId": 9001}


def test_generate_saves_video_before_reporting_partial_callbacks():
    events = []
    callback = OrderedPartialCallbackService(events)
    storage = FakeStorageService(events)
    service = HighlightService(
        callback_service=callback,
        generator=FakeGenerator(events),
        callback_enabled=True,
        storage_service=storage,
        storage_enabled=True,
    )
    request = HighlightGenerateRequest(
        highlight_id=505,
        user_id=7,
        group_id=10,
        highlight_date=date(2026, 8, 19),
        summary="함께 완료한 미션",
        clips=[
            {"clip_id": "clip-ok", "shared": False, "caption": "완료"},
            {"clip_id": "clip-fail", "shared": False, "caption": "완료"},
        ],
    )

    result = asyncio.run(service.generate(request))

    assert events == [
        "video_saved",
        "metadata_saved",
        "callback:clip-ok",
        "callback:clip-fail",
    ]
    assert result.status == "COMPLETED"
    assert result.storage_status == "COMPLETED"
    assert result.stored_highlight_id == 9001
    assert result.callback_status == "PARTIAL"
    assert result.notified_clip_ids == ["clip-ok"]
    assert result.failed_clip_ids == ["clip-fail"]
    assert storage.calls == [
        {
            "user_id": 7,
            "group_id": 10,
            "highlight_date": date(2026, 8, 19),
            "title": "오늘의 W 하이라이트",
            "summary": "함께 완료한 미션",
            "video_url": "http://be-a/highlight-505.mp4",
        }
    ]


class FailingStorageService:
    async def save_highlight(self, **payload):
        raise HighlightStorageError("BE C unavailable")


def test_generate_does_not_notify_be_b_when_be_c_storage_fails():
    events = []
    callback = OrderedPartialCallbackService(events)
    service = HighlightService(
        callback_service=callback,
        generator=FakeGenerator(events),
        callback_enabled=True,
        storage_service=FailingStorageService(),
        storage_enabled=True,
    )
    request = HighlightGenerateRequest(
        highlight_id=507,
        user_id=7,
        group_id=10,
        highlight_date=date(2026, 8, 19),
        clips=[{"clip_id": "clip-ok", "shared": False, "caption": "완료"}],
    )

    with pytest.raises(HighlightStorageError):
        asyncio.run(service.generate(request))

    assert events == ["video_saved"]
    assert callback.calls == []


def test_generate_rejects_duplicate_clip_ids():
    with pytest.raises(ValidationError):
        HighlightGenerateRequest(
            highlight_id=506,
            group_id=10,
            clips=[
                {"clip_id": "clip-1", "shared": False, "caption": "완료"},
                {"clip_id": "clip-1", "shared": False, "caption": "완료"},
            ],
        )
