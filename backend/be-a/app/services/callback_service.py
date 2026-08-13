import asyncio
import hashlib
import os
from typing import Callable, Optional
from urllib.parse import quote

import httpx

from app.schemas.common import ExternalId


class CallbackConfigurationError(RuntimeError):
    pass


class HighlightCallbackService:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        retry_attempts: Optional[int] = None,
        backoff_seconds: Optional[float] = None,
        client_factory: Optional[Callable] = None,
        sleep_func=None,
    ):
        self.base_url = (base_url or os.getenv("BE_B_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.getenv("INTERNAL_API_KEY")
        configured_attempts = retry_attempts or int(os.getenv("HIGHLIGHT_CALLBACK_RETRY_ATTEMPTS", "3"))
        self.retry_attempts = max(1, min(configured_attempts, 5))
        configured_backoff = (
            backoff_seconds
            if backoff_seconds is not None
            else float(os.getenv("HIGHLIGHT_CALLBACK_BACKOFF_SECONDS", "0.25"))
        )
        self.backoff_seconds = max(0.0, min(configured_backoff, 60.0))
        self.client_factory = client_factory or httpx.AsyncClient
        self.sleep_func = sleep_func or asyncio.sleep

    async def notify_highlight_complete(
        self,
        clip_id: ExternalId,
        highlight_id: int,
    ) -> dict:
        if not self.base_url:
            raise CallbackConfigurationError("BE_B_BASE_URL 환경변수가 필요합니다.")

        headers = {}
        if self.api_key:
            headers["X-Internal-Key"] = self.api_key
        headers["Idempotency-Key"] = self._idempotency_key(highlight_id, clip_id)

        encoded_clip_id = quote(str(clip_id), safe="")
        url = "{0}/api/clips/{1}/highlight-complete".format(self.base_url, encoded_clip_id)

        async with self.client_factory(timeout=10.0) as client:
            for attempt in range(self.retry_attempts):
                try:
                    response = await client.post(url, headers=headers)
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as exc:
                    if not self._is_retryable_status(exc.response.status_code):
                        raise
                    if attempt + 1 >= self.retry_attempts:
                        raise
                except httpx.TransportError:
                    if attempt + 1 >= self.retry_attempts:
                        raise

                delay = self.backoff_seconds * (2 ** attempt)
                if delay > 0:
                    await self.sleep_func(delay)

        raise RuntimeError("하이라이트 완료 콜백이 결과 없이 종료되었습니다.")

    @staticmethod
    def _is_retryable_status(status_code: int) -> bool:
        return status_code in {408, 425, 429} or status_code >= 500

    @staticmethod
    def _idempotency_key(highlight_id: int, clip_id: ExternalId) -> str:
        raw = "{0}:{1}".format(highlight_id, clip_id).encode("utf-8")
        digest = hashlib.sha256(raw).hexdigest()
        return "welllog-highlight-{0}".format(digest)
