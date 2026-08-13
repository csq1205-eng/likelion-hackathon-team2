from datetime import date, timedelta
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, ExternalId


class DailyGroupStat(ApiModel):
    date: date
    assigned_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_counts(self):
        if self.completed_mission_count > self.assigned_mission_count:
            raise ValueError("일일 완료 미션 수는 배정 미션 수를 초과할 수 없습니다.")
        return self


class WeeklyReportRequest(ApiModel):
    group_id: ExternalId
    week_start_date: date
    member_count: int = Field(ge=1, le=100)
    assigned_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)
    completion_rate: float = Field(ge=0.0, le=100.0)
    previous_week_completion_rate: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    current_streak_days: int = Field(default=0, ge=0, le=3660)
    daily_stats: List[DailyGroupStat] = Field(default_factory=list, max_length=7)
    top_mission_types: List[str] = Field(default_factory=list, max_length=5)

    @model_validator(mode="after")
    def validate_aggregates(self):
        if self.completed_mission_count > self.assigned_mission_count:
            raise ValueError("완료 미션 수는 배정 미션 수를 초과할 수 없습니다.")

        week_end = self.week_start_date + timedelta(days=6)
        dates = [stat.date for stat in self.daily_stats]
        if len(dates) != len(set(dates)):
            raise ValueError("dailyStats 날짜는 중복될 수 없습니다.")
        if any(stat_date < self.week_start_date or stat_date > week_end for stat_date in dates):
            raise ValueError("dailyStats는 요청한 주간 범위 안에 있어야 합니다.")
        return self


class WeeklyReportResponse(ApiModel):
    group_id: ExternalId
    week_start_date: date
    week_end_date: date
    summary_text: str = Field(min_length=1, max_length=500)
    encouragement_text: str = Field(min_length=1, max_length=300)
    report_source: Literal["AI", "FALLBACK"]
