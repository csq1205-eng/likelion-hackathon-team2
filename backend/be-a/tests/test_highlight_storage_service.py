import asyncio
from datetime import date

import httpx
import pytest

from app.services.highlight_storage_service import (
    HighlightStorageConfigurationError,
    HighlightStorageResponseError,
    HighlightStorageService,
)


def test_storage_posts_be_c_contract_and_retries_retryable_status():
    calls = []
    delays = []

    def handler(request):
        calls.append(request)
        if len(calls) == 1:
            return httpx.Response(503, request=request)
        return httpx.Response(
            200,
            json={
                "success": True,
                "data": {
                    "highlightId": 91,
                    "highlightDate": "2026-08-19",
                    "title": "오늘의 W 하이라이트",
                    "summary": "함께 완료한 미션",
                    "videoUrl": "https://be-a/highlight-91.mp4",
                },
                "message": None,
            },
            request=request,
        )

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    async def fake_sleep(delay):
        delays.append(delay)

    service = HighlightStorageService(
        base_url="https://be-c.example",
        api_key="internal-secret",
        retry_attempts=3,
        backoff_seconds=0.1,
        client_factory=client_factory,
        sleep_func=fake_sleep,
    )

    result = asyncio.run(
        service.save_highlight(
            user_id=7,
            group_id=10,
            highlight_date=date(2026, 8, 19),
            title="오늘의 W 하이라이트",
            summary="함께 완료한 미션",
            video_url="https://be-a/highlight-91.mp4",
        )
    )

    assert result["highlightId"] == 91
    assert len(calls) == 2
    assert delays == [0.1]
    assert calls[1].url == "https://be-c.example/api/v1/internal/highlights"
    assert calls[1].headers["X-Internal-Key"] == "internal-secret"
    assert calls[1].headers["Content-Type"] == "application/json"
    assert calls[1].read().decode("utf-8") == (
        '{"userId":7,"groupId":10,"highlightDate":"2026-08-19",'
        '"title":"오늘의 W 하이라이트","summary":"함께 완료한 미션",'
        '"videoUrl":"https://be-a/highlight-91.mp4"}'
    )


def test_storage_does_not_retry_non_retryable_4xx():
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(403, request=request)

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    service = HighlightStorageService(
        base_url="https://be-c.example",
        retry_attempts=3,
        backoff_seconds=0,
        client_factory=client_factory,
    )

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(
            service.save_highlight(
                user_id=None,
                group_id=10,
                highlight_date=date(2026, 8, 19),
                title="제목",
                summary=None,
                video_url="https://be-a/highlight.mp4",
            )
        )

    assert len(calls) == 1


def test_storage_requires_be_c_base_url():
    service = HighlightStorageService(base_url="")

    with pytest.raises(HighlightStorageConfigurationError):
        asyncio.run(
            service.save_highlight(
                user_id=7,
                group_id=10,
                highlight_date=date(2026, 8, 19),
                title="제목",
                summary=None,
                video_url="https://be-a/highlight.mp4",
            )
        )


def test_storage_rejects_invalid_success_response():
    def handler(request):
        return httpx.Response(
            200,
            json={"success": True, "data": None, "message": None},
            request=request,
        )

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    service = HighlightStorageService(
        base_url="https://be-c.example",
        client_factory=client_factory,
    )

    with pytest.raises(HighlightStorageResponseError):
        asyncio.run(
            service.save_highlight(
                user_id=7,
                group_id=10,
                highlight_date=date(2026, 8, 19),
                title="제목",
                summary=None,
                video_url="https://be-a/highlight.mp4",
            )
        )


def test_storage_rejects_success_response_without_highlight_id():
    def handler(request):
        return httpx.Response(
            200,
            json={"success": True, "data": {"title": "제목"}, "message": None},
            request=request,
        )

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    service = HighlightStorageService(
        base_url="https://be-c.example",
        client_factory=client_factory,
    )

    with pytest.raises(HighlightStorageResponseError):
        asyncio.run(
            service.save_highlight(
                user_id=7,
                group_id=10,
                highlight_date=date(2026, 8, 19),
                title="제목",
                summary=None,
                video_url="https://be-a/highlight.mp4",
            )
        )
