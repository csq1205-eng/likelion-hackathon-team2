import asyncio
import os
from datetime import date
from typing import Callable, Optional

import httpx


class HighlightStorageError(RuntimeError):
    pass


class HighlightStorageConfigurationError(HighlightStorageError):
    pass


class HighlightStorageResponseError(HighlightStorageError):
    pass


class HighlightStorageService:
    """BE C에 생성이 끝난 하이라이트 메타데이터를 저장한다."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        retry_attempts: Optional[int] = None,
        backoff_seconds: Optional[float] = None,
        client_factory: Optional[Callable] = None,
        sleep_func=None,
    ):
        self.base_url = (base_url or os.getenv("BE_C_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.getenv("INTERNAL_API_KEY")
        configured_attempts = retry_attempts or int(
            os.getenv("HIGHLIGHT_STORAGE_RETRY_ATTEMPTS", "3")
        )
        self.retry_attempts = max(1, min(configured_attempts, 5))
        configured_backoff = (
            backoff_seconds
            if backoff_seconds is not None
            else float(os.getenv("HIGHLIGHT_STORAGE_BACKOFF_SECONDS", "0.25"))
        )
        self.backoff_seconds = max(0.0, min(configured_backoff, 60.0))
        self.client_factory = client_factory or httpx.AsyncClient
        self.sleep_func = sleep_func or asyncio.sleep

    async def save_highlight(
        self,
        *,
        user_id: Optional[int],
        group_id: int,
        highlight_date: date,
        title: str,
        summary: Optional[str],
        video_url: str,
    ) -> dict:
        if not self.base_url:
            raise HighlightStorageConfigurationError(
                "BE_C_BASE_URL 환경변수가 필요합니다."
            )

        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["X-Internal-Key"] = self.api_key

        payload = {
            "userId": user_id,
            "groupId": group_id,
            "highlightDate": highlight_date.isoformat(),
            "title": title,
            "summary": summary,
            "videoUrl": video_url,
        }
        url = f"{self.base_url}/api/v1/internal/highlights"

        async with self.client_factory(timeout=10.0) as client:
            for attempt in range(self.retry_attempts):
                try:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    return self._parse_response(response)
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

        raise HighlightStorageError("BE C 하이라이트 저장이 결과 없이 종료되었습니다.")

    @staticmethod
    def _parse_response(response: httpx.Response) -> dict:
        try:
            body = response.json()
        except ValueError as exc:
            raise HighlightStorageResponseError(
                "BE C가 올바른 JSON 응답을 반환하지 않았습니다."
            ) from exc

        data = body.get("data") if isinstance(body, dict) else None
        if (
            not isinstance(body, dict)
            or body.get("success") is not True
            or not isinstance(data, dict)
        ):
            raise HighlightStorageResponseError(
                "BE C 하이라이트 저장 응답 형식이 올바르지 않습니다."
            )
        highlight_id = data.get("highlightId")
        if (
            isinstance(highlight_id, bool)
            or not isinstance(highlight_id, int)
            or highlight_id <= 0
        ):
            raise HighlightStorageResponseError(
                "BE C 하이라이트 저장 응답에 유효한 highlightId가 없습니다."
            )
        return data

    @staticmethod
    def _is_retryable_status(status_code: int) -> bool:
        return status_code in {408, 425, 429} or status_code >= 500
