import logging
from datetime import datetime
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT_SEC = 10.0


class MissionResultClient:
    """BE C의 POST /api/v1/missions/results 를 호출해 판정 결과를 알려준다.

    BE C가 그룹 진행률/스탬프/리워드를 계산하려면 이 결과가 필요하지만,
    BE B의 클립 업로드 응답 자체는 이 호출의 성패와 무관해야 한다. 실패해도
    사용자에게는 정상 응답을 돌려주고 로그만 남긴다 (BE A highlight-complete
    콜백과 달리 재시도는 하지 않는다 — MVP 단순화).
    """

    def __init__(self, base_url: Optional[str] = None, client: Optional[httpx.Client] = None):
        self.base_url = (base_url if base_url is not None else settings.be_c_base_url).rstrip("/")
        self._client = client

    def notify_result(
        self,
        mission_id: int,
        clip_id: int,
        result: str,
        judged_at: datetime,
        reason: Optional[str] = None,
        confidence_score: Optional[float] = None,
        prompt_version: Optional[str] = None,
        model_version: Optional[str] = None,
    ) -> None:
        if not self.base_url:
            return

        body = {
            "missionId": mission_id,
            "clipId": clip_id,
            "result": result,
            "reason": reason,
            "confidenceScore": confidence_score,
            "promptVersion": prompt_version,
            "modelVersion": model_version,
            # BE C의 judgedAt은 오프셋이 없는 LocalDateTime이므로 tz 정보를 제거해서 보낸다.
            "judgedAt": judged_at.replace(tzinfo=None).isoformat(),
        }

        headers = {}
        if settings.internal_api_key:
            headers["X-Internal-Key"] = settings.internal_api_key

        owns_client = self._client is None
        client = self._client or httpx.Client(timeout=_TIMEOUT_SEC)
        try:
            response = client.post(f"{self.base_url}/api/v1/missions/results", json=body, headers=headers)
            response.raise_for_status()
        except httpx.HTTPError:
            logger.warning(
                "BE C 판정 결과 전달 실패 (mission_id=%s, clip_id=%s)",
                mission_id,
                clip_id,
                exc_info=True,
            )
        finally:
            if owns_client:
                client.close()
