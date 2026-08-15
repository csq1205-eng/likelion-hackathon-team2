import httpx

from app.services.reason_client import ReasonClient
from app.services.vision_service import VisionCriterion


def _client_returning(json_body: dict, status_code: int = 200) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json=json_body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def _call_get_reason(client: httpx.Client):
    reason_client = ReasonClient(base_url="http://be-a.test", client=client)
    return reason_client.get_reason(
        mission_id=1,
        clip_id=2,
        verdict="PASS",
        confidence_score=90.0,
        criteria=[VisionCriterion(id="drink_water", met=True, description="물을 마심")],
        model_notes="ok",
    )


def test_get_reason_parses_be_a_common_response_envelope():
    """BE A가 명세서 공통 봉투({success, data, message})로 감싸서 응답하는 현재 형태를 파싱한다."""
    client = _client_returning(
        {
            "success": True,
            "data": {
                "missionId": 1,
                "clipId": 2,
                "verdict": "PASS",
                "reason": "물을 마시는 모습이 확인됐어요.",
                "reasonSource": "AI",
            },
            "message": None,
        }
    )

    reason, source = _call_get_reason(client)

    assert reason == "물을 마시는 모습이 확인됐어요."
    assert source == "AI"


def test_get_reason_falls_back_when_be_a_returns_error_status():
    client = _client_returning({"success": False}, status_code=502)

    reason, source = _call_get_reason(client)

    assert source == "FALLBACK"
    assert reason
