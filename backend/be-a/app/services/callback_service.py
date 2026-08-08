import os
from typing import Optional

import httpx


class CallbackConfigurationError(RuntimeError):
    pass


class HighlightCallbackService:
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.base_url = (base_url or os.getenv("BE_B_BASE_URL", "")).rstrip("/")
        self.api_key = api_key or os.getenv("INTERNAL_API_KEY")

    async def notify_highlight_complete(
        self,
        clip_id: int,
    ) -> dict:
        if not self.base_url:
            raise CallbackConfigurationError("BE_B_BASE_URL 환경변수가 필요합니다.")

        headers = {}
        if self.api_key:
            headers["X-Internal-Key"] = self.api_key

        url = "{0}/api/clips/{1}/highlight-complete".format(self.base_url, clip_id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers)
            response.raise_for_status()
            return response.json()
