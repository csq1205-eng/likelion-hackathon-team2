from fastapi.testclient import TestClient

from app.main import app


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
