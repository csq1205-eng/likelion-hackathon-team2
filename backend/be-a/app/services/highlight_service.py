import asyncio
import logging
import os

import httpx

from app.schemas.highlight import HighlightCompleteRequest, HighlightCompleteResponse
from app.schemas.highlight import HighlightGenerateRequest, HighlightGenerateResponse
from app.services.callback_service import CallbackConfigurationError, HighlightCallbackService
from app.services.highlight_generator import FFmpegHighlightGenerator, HighlightSourceFetcher


logger = logging.getLogger(__name__)


class HighlightService:
    def __init__(
        self,
        callback_service=None,
        generator=None,
        source_fetcher=None,
        callback_enabled=None,
    ):
        self.callback_service = callback_service or HighlightCallbackService()
        self.generator = generator
        self.source_fetcher = source_fetcher or HighlightSourceFetcher()
        if callback_enabled is None:
            configured = os.getenv("HIGHLIGHT_CALLBACK_ENABLED")
            if configured is None:
                self.callback_enabled = os.getenv("APP_ENV", "local") not in {"local", "test"}
            else:
                self.callback_enabled = configured.strip().lower() in {"1", "true", "yes", "on"}
        else:
            self.callback_enabled = callback_enabled

    async def generate(self, request: HighlightGenerateRequest) -> HighlightGenerateResponse:
        generator = self.generator or FFmpegHighlightGenerator()
        _, duration, video_url = await asyncio.to_thread(
            generator.generate,
            request,
            self.source_fetcher,
        )

        notified_clip_ids = []
        failed_clip_ids = []
        if self.callback_enabled:
            notified_clip_ids, failed_clip_ids = await self._notify_all(
                request.highlight_id,
                [clip.clip_id for clip in request.clips],
            )

        return HighlightGenerateResponse(
            highlight_id=request.highlight_id,
            group_id=request.group_id,
            status="COMPLETED",
            video_url=video_url,
            duration_seconds=duration,
            notified_clip_ids=notified_clip_ids,
            failed_clip_ids=failed_clip_ids,
            callback_status=(
                self._callback_status(notified_clip_ids, failed_clip_ids)
                if self.callback_enabled
                else "SKIPPED"
            ),
        )

    async def complete(self, request: HighlightCompleteRequest) -> HighlightCompleteResponse:
        # 실제 영상 생성기가 붙으면 '최종 영상 저장 성공' 직후 이 메서드를 호출한다.
        notified_clip_ids, failed_clip_ids = await self._notify_all(
            request.highlight_id,
            request.clip_ids,
        )

        return HighlightCompleteResponse(
            highlight_id=request.highlight_id,
            notified_clip_ids=notified_clip_ids,
            failed_clip_ids=failed_clip_ids,
            status=self._callback_status(notified_clip_ids, failed_clip_ids),
        )

    async def _notify_all(self, highlight_id, clip_ids):
        notified_clip_ids = []
        failed_clip_ids = []
        for clip_id in clip_ids:
            try:
                await self.callback_service.notify_highlight_complete(
                    clip_id=clip_id,
                    highlight_id=highlight_id,
                )
                notified_clip_ids.append(clip_id)
            except (CallbackConfigurationError, httpx.HTTPError):
                logger.exception(
                    "BE B 하이라이트 완료 콜백에 실패했습니다.",
                    extra={"highlight_id": highlight_id, "clip_id": str(clip_id)},
                )
                failed_clip_ids.append(clip_id)
        return notified_clip_ids, failed_clip_ids

    @staticmethod
    def _callback_status(notified_clip_ids, failed_clip_ids):
        if failed_clip_ids and notified_clip_ids:
            return "PARTIAL"
        if failed_clip_ids:
            return "FAILED"
        return "COMPLETED"
