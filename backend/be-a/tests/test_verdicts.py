from fastapi.testclient import TestClient

from app.main import app
from app.schemas.verdict import VerdictReasonRequest


client = TestClient(app)


def test_fail_returns_retry_message_without_exposing_notes():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "missionId": 100,
            "clipId": 200,
            "verdict": "FAIL",
            "confidenceScore": 72.0,
            "criteria": [
                {"id": "product_visible", "met": True},
                {"id": "application_action", "met": False},
            ],
            "model_notes": "SECRET INTERNAL MODEL NOTE",
            "processed_at": "2026-08-03T12:30:00Z",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "FAIL"
    assert body["reasonSource"] == "FALLBACK"
    assert "다시 촬영" in body["reason"]
    assert "SECRET" not in body["reason"]


def test_pass_returns_completed_message():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "missionId": 100,
            "clipId": 200,
            "verdict": "PASS",
            "confidenceScore": 98.0,
            "criteria": [{"id": "application_action", "met": True}],
            "model_notes": "Internal only",
            "processed_at": "2026-08-03T12:30:00Z",
        },
    )

    assert response.status_code == 200
    assert "인증이 완료" in response.json()["reason"]
    assert response.json()["reasonSource"] == "FALLBACK"


def test_error_returns_system_message():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "missionId": 100,
            "clipId": 200,
            "verdict": "ERROR",
            "confidenceScore": 0.0,
            "criteria": [],
            "modelNotes": "Internal system error",
            "processedAt": "2026-08-03T12:30:00Z",
        },
    )

    assert response.status_code == 200
    assert "일시적인 오류" in response.json()["reason"]


def test_hold_returns_retry_message_without_counting_as_fail():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "missionId": 100,
            "clipId": 200,
            "verdict": "HOLD",
            "confidenceScore": 72.0,
            "criteria": [],
            "modelNotes": "Uncertain result",
            "processedAt": "2026-08-03T12:30:00Z",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "HOLD"
    assert "명확하게 확인하기 어려웠어요" in body["reason"]
    assert body["reasonSource"] == "FALLBACK"


def test_confidence_score_must_be_percentage():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "missionId": 100,
            "clipId": 200,
            "verdict": "PASS",
            "confidenceScore": 101.0,
            "criteria": [],
            "modelNotes": "Internal only",
            "processedAt": "2026-08-03T12:30:00Z",
        },
    )

    assert response.status_code == 422


def test_accepts_be_b_native_verdict_payload_with_uuid():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "mission_id": "mission-2026-08-10-001",
            "clip_id": "83fe9cc1-08f8-4192-9510-ff7866836286",
            "verdict": "hold",
            "confidence": 0.72,
            "criteria": [{"id": "application_action", "met": False}],
            "model_notes": "SECRET BE B INTERNAL NOTE",
            "processed_at": "2026-08-10T12:30:00Z",
            "raw_verdict": "pass",
            "policy_version": "v1",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["missionId"] == "mission-2026-08-10-001"
    assert body["clipId"] == "83fe9cc1-08f8-4192-9510-ff7866836286"
    assert body["verdict"] == "HOLD"
    assert body["reasonSource"] == "FALLBACK"
    assert "SECRET" not in response.text


def test_converts_be_b_confidence_ratio_to_percentage():
    request = VerdictReasonRequest.model_validate(
        {
            "mission_id": "mission-1",
            "clip_id": "clip-1",
            "verdict": "pass",
            "confidence": 0.72,
            "criteria": [],
            "model_notes": "internal only",
            "processed_at": "2026-08-10T12:30:00Z",
        }
    )

    assert request.confidence_score == 72.0
    assert request.verdict == "PASS"


def test_rejects_empty_be_b_identifier():
    response = client.post(
        "/api/ai/verdicts/reason",
        json={
            "mission_id": " ",
            "clip_id": "clip-1",
            "verdict": "pass",
            "confidence": 0.95,
            "criteria": [],
            "model_notes": "",
            "processed_at": "2026-08-10T12:30:00Z",
        },
    )

    assert response.status_code == 422
