import logging
from datetime import timedelta

from app.schemas.report import WeeklyReportRequest, WeeklyReportResponse
from app.services.llm_service import LLMService


logger = logging.getLogger(__name__)


class WeeklyReportService:
    def __init__(self, llm_service=None) -> None:
        self.llm_service = llm_service or LLMService()

    def generate(self, request: WeeklyReportRequest) -> WeeklyReportResponse:
        if self.llm_service.available:
            try:
                generated = self.llm_service.generate_weekly_report(request)
                return self._response(
                    request,
                    generated.summary_text.strip(),
                    generated.encouragement_text.strip(),
                    "AI",
                )
            except Exception:
                logger.exception("OpenAI 주간 리포트 생성에 실패해 fallback 문장을 사용합니다.")

        summary, encouragement = self._fallback_messages(request)
        return self._response(request, summary, encouragement, "FALLBACK")

    @staticmethod
    def _response(request, summary, encouragement, source):
        return WeeklyReportResponse(
            group_id=request.group_id,
            week_start_date=request.week_start_date,
            week_end_date=request.week_start_date + timedelta(days=6),
            summary_text=summary,
            encouragement_text=encouragement,
            report_source=source,
        )

    @staticmethod
    def _fallback_messages(request: WeeklyReportRequest):
        if request.assigned_mission_count == 0:
            return (
                "이번 주에는 집계된 그룹 미션이 없었어요.",
                "다음 미션부터 서로 부담 없이 응원하며 시작해 봐요.",
            )

        summary = (
            f"이번 주 그룹은 배정된 미션 {request.assigned_mission_count}개 중 "
            f"{request.completed_mission_count}개를 완료해 완료율 {request.completion_rate:g}%를 기록했어요."
        )
        if request.previous_week_completion_rate is not None:
            delta = request.completion_rate - request.previous_week_completion_rate
            if delta > 0:
                summary += f" 지난주보다 {delta:g}%p 높아졌어요."
            elif delta < 0:
                summary += f" 지난주보다 {abs(delta):g}%p 낮지만 다시 이어갈 수 있어요."
            else:
                summary += " 지난주와 같은 완료율을 유지했어요."

        if request.current_streak_days > 0:
            encouragement = (
                f"함께 이어온 {request.current_streak_days}일의 흐름을 다음 주에도 가볍게 이어가 봐요."
            )
        else:
            encouragement = "완료하지 못한 날도 괜찮아요. 다음 주에는 한 가지 미션부터 함께 시작해 봐요."
        return summary, encouragement
