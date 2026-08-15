import json
from datetime import datetime, timezone

import httpx

from app.services.mission_result_client import MissionResultClient


def test_notify_result_sends_expected_payload_and_strips_timezone():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content)
        return httpx.Response(200, json={"missionResultId": 1})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result_client = MissionResultClient(base_url="http://be-c.test", client=client)

    judged_at = datetime(2026, 8, 14, 1, 39, 48, 167372, tzinfo=timezone.utc)
    result_client.notify_result(
        mission_id=100,
        clip_id=200,
        result="PASS",
        judged_at=judged_at,
        reason="미션 수행이 확인되어 인증이 완료됐어요.",
        confidence_score=95.0,
        prompt_version="mission-judge-prompt-v1",
        model_version="gpt-4o-mini",
    )

    body = captured["json"]
    assert body["missionId"] == 100
    assert body["clipId"] == 200
    assert body["result"] == "PASS"
    assert body["reason"] == "미션 수행이 확인되어 인증이 완료됐어요."
    assert body["confidenceScore"] == 95.0
    # BE C의 judgedAt은 LocalDateTime(오프셋 없음)이므로 tz 정보 없이 보내야 한다.
    assert body["judgedAt"] == "2026-08-14T01:39:48.167372"


def test_notify_result_does_not_raise_when_be_c_is_unreachable():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result_client = MissionResultClient(base_url="http://be-c.test", client=client)

    # 예외 없이 조용히 실패해야 한다 (BE B 응답은 BE C 상태와 무관해야 함).
    result_client.notify_result(
        mission_id=100,
        clip_id=200,
        result="PASS",
        judged_at=datetime.now(timezone.utc),
    )


def test_notify_result_is_noop_when_base_url_not_configured():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json={})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    result_client = MissionResultClient(base_url="", client=client)

    result_client.notify_result(
        mission_id=100,
        clip_id=200,
        result="PASS",
        judged_at=datetime.now(timezone.utc),
    )

    assert calls == []
