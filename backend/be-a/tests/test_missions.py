from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_generate_personalized_missions() -> None:
    response = client.post(
        "/api/ai/missions/generate",
        json={
            "user_id": "user-123",
            "goal": "여름 전까지 피부 컨디션 개선",
            "profile": {
                "skin_type": "dry",
                "concerns": ["각질", "수분 부족"],
                "sleep_hours": 6,
                "pain_areas": [],
            },
            "environment": {
                "weather": "sunny",
                "temperature": 29,
                "uv_index": 8,
                "fine_dust": "normal",
            },
            "excluded_missions": ["아침 러닝"],
            "max_missions": 3,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["missions"]) == 3
    assert body["missions"][0]["missionType"] == "SUN_CARE"
    assert "자외선 지수가 8" in body["missions"][0]["reason"]
    assert body["generationMode"] == "fallback"
    assert body["appliedFilters"]["exclusions"] == ["아침 러닝"]


def test_bad_dust_and_knee_pain_remove_outdoor_missions() -> None:
    response = client.post(
        "/api/ai/missions/generate",
        json={
            "user_id": "user-456",
            "goal": "건강한 생활 습관 만들기",
            "profile": {
                "skin_type": "normal",
                "concerns": [],
                "pain_areas": ["무릎"],
            },
            "environment": {
                "fine_dust": "bad",
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert all(
        mission["missionType"] != "OUTDOOR_ACTIVITY"
        for mission in body["missions"]
    )
    assert len(body["appliedFilters"]["safety"]) == 2


def test_reject_more_than_three_missions() -> None:
    response = client.post(
        "/api/ai/missions/generate",
        json={
            "user_id": "user-789",
            "goal": "피부 관리",
            "profile": {
                "skin_type": "oily",
            },
            "max_missions": 4,
        },
    )

    assert response.status_code == 422


def test_response_can_be_saved_by_be_c() -> None:
    response = client.post(
        "/api/ai/missions/generate",
        json={
            "userId": 123,
            "goal": "피부 컨디션 개선",
            "profile": {
                "skinType": "dry",
                "concerns": ["건조함"],
            },
            "environment": {
                "uvIndex": 7,
            },
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["userId"] == 123
    assert body["missions"]

    required_storage_fields = {
        "title",
        "description",
        "missionType",
        "slot",
        "reason",
        "verificationCriteria",
    }
    assert required_storage_fields <= body["missions"][0].keys()