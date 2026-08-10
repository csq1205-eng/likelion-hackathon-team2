from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _report_payload():
    return {
        "groupId": 10,
        "weekStartDate": "2026-08-03",
        "memberCount": 4,
        "assignedMissionCount": 20,
        "completedMissionCount": 15,
        "completionRate": 75.0,
    }


def test_internal_api_allows_local_mode_without_configured_key(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "")
    response = client.post("/api/ai/reports/weekly", json=_report_payload())
    assert response.status_code == 200


def test_internal_api_rejects_missing_key_when_configured(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-secret")
    response = client.post("/api/ai/reports/weekly", json=_report_payload())
    assert response.status_code == 401


def test_internal_api_rejects_wrong_key(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-secret")
    response = client.post(
        "/api/ai/reports/weekly",
        json=_report_payload(),
        headers={"X-Internal-Key": "wrong-key"},
    )
    assert response.status_code == 403


def test_internal_api_accepts_matching_key(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-secret")
    response = client.post(
        "/api/ai/reports/weekly",
        json=_report_payload(),
        headers={"X-Internal-Key": "test-internal-secret"},
    )
    assert response.status_code == 200


def test_health_check_never_requires_internal_key(monkeypatch):
    monkeypatch.setenv("INTERNAL_API_KEY", "test-internal-secret")
    response = client.get("/health")
    assert response.status_code == 200
