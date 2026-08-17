from fastapi.testclient import TestClient

from app.main import app
from app.schemas.report import PersonalWeeklyReportRequest, WeeklyReportRequest
from app.services.llm_service import GeneratedWeeklyReport
from app.services.report_service import PersonalWeeklyReportService, WeeklyReportService


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


def _personal_payload():
    return {
        "userId": 123,
        "weekStartDate": "2026-08-03",
        "weekEndDate": "2026-08-09",
        "totalMissionCount": 6,
        "completedMissionCount": 4,
        "failedMissionCount": 1,
        "notSubmittedMissionCount": 1,
        "completionRate": 66.66666666666667,
        "achievedDayCount": 1,
        "currentStreakDays": 0,
        "longestStreakDays": 1,
        "dailyStats": [
            {
                "date": "2026-08-03",
                "totalMissionCount": 3,
                "completedMissionCount": 1,
                "failedMissionCount": 1,
                "notSubmittedMissionCount": 1,
                "completionRate": 33.333333333333336,
                "achieved": False,
            },
            {
                "date": "2026-08-04",
                "totalMissionCount": 3,
                "completedMissionCount": 3,
                "failedMissionCount": 0,
                "notSubmittedMissionCount": 0,
                "completionRate": 100.0,
                "achieved": True,
            },
            *[
                {
                    "date": f"2026-08-{day:02d}",
                    "totalMissionCount": 0,
                    "completedMissionCount": 0,
                    "failedMissionCount": 0,
                    "notSubmittedMissionCount": 0,
                    "completionRate": 0.0,
                    "achieved": False,
                }
                for day in range(5, 10)
            ],
        ],
        "missionTypeStats": [
            {
                "missionType": "HYDRATION",
                "totalMissionCount": 2,
                "completedMissionCount": 2,
                "failedMissionCount": 0,
                "notSubmittedMissionCount": 0,
                "completionRate": 100.0,
            },
            {
                "missionType": "STRETCHING",
                "totalMissionCount": 2,
                "completedMissionCount": 1,
                "failedMissionCount": 1,
                "notSubmittedMissionCount": 0,
                "completionRate": 50.0,
            },
            {
                "missionType": "SLEEP",
                "totalMissionCount": 2,
                "completedMissionCount": 1,
                "failedMissionCount": 0,
                "notSubmittedMissionCount": 1,
                "completionRate": 50.0,
            },
        ],
        "slotStats": [
            {
                "slot": "MORNING",
                "totalMissionCount": 2,
                "completedMissionCount": 2,
                "failedMissionCount": 0,
                "notSubmittedMissionCount": 0,
                "completionRate": 100.0,
            },
            {
                "slot": "NOON",
                "totalMissionCount": 2,
                "completedMissionCount": 1,
                "failedMissionCount": 1,
                "notSubmittedMissionCount": 0,
                "completionRate": 50.0,
            },
            {
                "slot": "EVENING",
                "totalMissionCount": 2,
                "completedMissionCount": 1,
                "failedMissionCount": 0,
                "notSubmittedMissionCount": 1,
                "completionRate": 50.0,
            },
        ],
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


def test_personal_weekly_report_returns_rule_based_fallback():
    response = client.post(
        "/api/ai/reports/weekly/personal",
        json=_personal_payload(),
    )

    assert response.status_code == 200, response.text
    body = response.json()["data"]
    assert body["userId"] == 123
    assert body["weekStartDate"] == "2026-08-03"
    assert body["weekEndDate"] == "2026-08-09"
    assert body["reportSource"] == "FALLBACK"
    assert "완료율 66.6667%" in body["summaryText"]
    assert "HYDRATION" in body["summaryText"]
    assert "MORNING" in body["encouragementText"]


def test_personal_weekly_report_rejects_inconsistent_counts():
    payload = _personal_payload()
    payload["completedMissionCount"] = 5

    response = client.post("/api/ai/reports/weekly/personal", json=payload)

    assert response.status_code == 422


def test_personal_weekly_report_rejects_inconsistent_completion_rate():
    payload = _personal_payload()
    payload["completionRate"] = 50.0

    response = client.post("/api/ai/reports/weekly/personal", json=payload)

    assert response.status_code == 422


def test_personal_weekly_report_rejects_missing_daily_date():
    payload = _personal_payload()
    payload["dailyStats"][-1]["date"] = "2026-08-08"

    response = client.post("/api/ai/reports/weekly/personal", json=payload)

    assert response.status_code == 422


def test_personal_weekly_report_handles_empty_week():
    payload = _personal_payload()
    payload.update(
        {
            "totalMissionCount": 0,
            "completedMissionCount": 0,
            "failedMissionCount": 0,
            "notSubmittedMissionCount": 0,
            "completionRate": 0.0,
            "achievedDayCount": 0,
            "currentStreakDays": 0,
            "longestStreakDays": 0,
            "missionTypeStats": [],
            "slotStats": [],
        }
    )
    payload["dailyStats"] = [
        {
            "date": f"2026-08-{day:02d}",
            "totalMissionCount": 0,
            "completedMissionCount": 0,
            "failedMissionCount": 0,
            "notSubmittedMissionCount": 0,
            "completionRate": 0.0,
            "achieved": False,
        }
        for day in range(3, 10)
    ]

    response = client.post("/api/ai/reports/weekly/personal", json=payload)

    assert response.status_code == 200, response.text
    assert "집계된 개인 미션이 없었어요" in response.json()["data"]["summaryText"]


class FakePersonalReportLLMService:
    available = True

    def generate_personal_weekly_report(self, request):
        return GeneratedWeeklyReport(
            summary_text="이번 주에는 아침 수분 미션을 꾸준히 완료했어요.",
            encouragement_text="잘 맞는 시간대부터 다음 주에도 이어가 봐요.",
        )


def test_personal_weekly_report_uses_ai_result_when_available():
    service = PersonalWeeklyReportService(llm_service=FakePersonalReportLLMService())
    request = PersonalWeeklyReportRequest.model_validate(_personal_payload())

    result = service.generate(request)

    assert result.report_source == "AI"
    assert "아침 수분" in result.summary_text


class FailingPersonalReportLLMService(FakePersonalReportLLMService):
    def generate_personal_weekly_report(self, request):
        raise RuntimeError("temporary AI error")


def test_personal_weekly_report_uses_fallback_when_ai_fails():
    service = PersonalWeeklyReportService(llm_service=FailingPersonalReportLLMService())
    request = PersonalWeeklyReportRequest.model_validate(_personal_payload())

    result = service.generate(request)

    assert result.report_source == "FALLBACK"
    assert "완료율 66.6667%" in result.summary_text
