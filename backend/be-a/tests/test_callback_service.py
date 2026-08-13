import asyncio

import httpx
import pytest

from app.services.callback_service import HighlightCallbackService


def test_callback_retries_retryable_status_with_same_idempotency_key():
    calls = []
    delays = []

    def handler(request):
        calls.append(request)
        if len(calls) == 1:
            return httpx.Response(503, request=request)
        return httpx.Response(200, json={"purged": True}, request=request)

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    async def fake_sleep(delay):
        delays.append(delay)

    service = HighlightCallbackService(
        base_url="http://be-b",
        api_key="internal-secret",
        retry_attempts=3,
        backoff_seconds=0.1,
        client_factory=client_factory,
        sleep_func=fake_sleep,
    )
    result = asyncio.run(service.notify_highlight_complete("clip-uuid-1", highlight_id=500))

    assert result == {"purged": True}
    assert len(calls) == 2
    assert delays == [0.1]
    assert calls[0].headers["X-Internal-Key"] == "internal-secret"
    assert calls[0].headers["Idempotency-Key"] == calls[1].headers["Idempotency-Key"]
    assert calls[0].headers["Idempotency-Key"].startswith("welllog-highlight-")


def test_callback_does_not_retry_non_retryable_4xx():
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(404, request=request)

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    service = HighlightCallbackService(
        base_url="http://be-b",
        retry_attempts=3,
        backoff_seconds=0,
        client_factory=client_factory,
    )

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(service.notify_highlight_complete("clip-1", highlight_id=500))

    assert len(calls) == 1


def test_callback_uses_exponential_backoff_until_attempts_are_exhausted():
    delays = []

    def handler(request):
        return httpx.Response(429, request=request)

    transport = httpx.MockTransport(handler)

    def client_factory(timeout):
        return httpx.AsyncClient(transport=transport, timeout=timeout)

    async def fake_sleep(delay):
        delays.append(delay)

    service = HighlightCallbackService(
        base_url="http://be-b",
        retry_attempts=3,
        backoff_seconds=0.25,
        client_factory=client_factory,
        sleep_func=fake_sleep,
    )

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(service.notify_highlight_complete("clip-1", highlight_id=500))

    assert delays == [0.25, 0.5]
