from fastapi.testclient import TestClient

from app.main import app
from app.schemas.report import WeeklyReportRequest
from app.services.llm_service import GeneratedWeeklyReport
from app.services.report_service import WeeklyReportService


client = TestClient(app)


def _payload():
    return {
        "groupId": "group-demo-1",
        "weekStartDate": "2026-08-03",
        "memberCount": 4,
        "assignedMissionCount": 20,
        "completedMissionCount": 15,
        "completionRate": 75.0,
        "previousWeekCompletionRate": 60.0,
        "currentStreakDays": 5,
        "dailyStats": [
            {
                "date": "2026-08-03",
                "assignedMissionCount": 3,
                "completedMissionCount": 2,
            },
            {
                "date": "2026-08-04",
                "assignedMissionCount": 3,
                "completedMissionCount": 3,
            },
        ],
        "topMissionTypes": ["HYDRATION", "SUN_CARE"],
    }


def test_weekly_report_returns_rule_based_fallback():
    response = client.post("/api/ai/reports/weekly", json=_payload())

    assert response.status_code == 200, response.text
    body = response.json()["data"]
    assert body["groupId"] == "group-demo-1"
    assert body["weekEndDate"] == "2026-08-09"
    assert body["reportSource"] == "FALLBACK"
    assert "완료율 75%" in body["summaryText"]
    assert "15%p 높아졌어요" in body["summaryText"]
    assert "5일" in body["encouragementText"]


def test_weekly_report_rejects_invalid_aggregate_counts():
    payload = _payload()
    payload["completedMissionCount"] = 21
    response = client.post("/api/ai/reports/weekly", json=payload)
    assert response.status_code == 422
    assert response.json()["code"] == "COMMON-001"


def test_weekly_report_rejects_daily_stat_outside_week():
    payload = _payload()
    payload["dailyStats"][0]["date"] = "2026-08-10"
    response = client.post("/api/ai/reports/weekly", json=payload)
    assert response.status_code == 422


class FakeReportLLMService:
    available = True

    def generate_weekly_report(self, request):
        return GeneratedWeeklyReport(
            summary_text="이번 주에도 그룹이 꾸준히 미션을 이어갔어요.",
            encouragement_text="서로의 작은 실천을 응원하며 다음 주도 함께해요.",
        )


def test_weekly_report_uses_ai_result_when_available():
    service = WeeklyReportService(llm_service=FakeReportLLMService())
    request = WeeklyReportRequest.model_validate(_payload())
    result = service.generate(request)

    assert result.report_source == "AI"
    assert "꾸준히" in result.summary_text


class FailingReportLLMService(FakeReportLLMService):
    def generate_weekly_report(self, request):
        raise RuntimeError("temporary AI error")


def test_weekly_report_uses_fallback_when_ai_fails():
    service = WeeklyReportService(llm_service=FailingReportLLMService())
    request = WeeklyReportRequest.model_validate(_payload())
    result = service.generate(request)

    assert result.report_source == "FALLBACK"
    assert "완료율 75%" in result.summary_text
