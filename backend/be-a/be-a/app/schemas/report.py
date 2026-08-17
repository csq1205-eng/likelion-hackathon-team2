import math
from datetime import date, timedelta
from typing import List, Literal, Optional

from pydantic import Field, model_validator

from app.schemas.common import ApiModel, ExternalId


def _validate_mission_aggregate(
    total_mission_count: int,
    completed_mission_count: int,
    failed_mission_count: int,
    not_submitted_mission_count: int,
    completion_rate: float,
) -> None:
    result_count = (
        completed_mission_count
        + failed_mission_count
        + not_submitted_mission_count
    )
    if result_count != total_mission_count:
        raise ValueError("완료·실패·미제출 미션 수의 합은 전체 미션 수와 같아야 합니다.")

    expected_rate = (
        completed_mission_count * 100.0 / total_mission_count
        if total_mission_count
        else 0.0
    )
    if not math.isclose(completion_rate, expected_rate, abs_tol=0.01):
        raise ValueError("completionRate가 미션 집계값과 일치하지 않습니다.")


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


class PersonalDailyStat(ApiModel):
    date: date
    total_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)
    failed_mission_count: int = Field(ge=0)
    not_submitted_mission_count: int = Field(ge=0)
    completion_rate: float = Field(ge=0.0, le=100.0)
    achieved: bool

    @model_validator(mode="after")
    def validate_aggregate(self):
        _validate_mission_aggregate(
            self.total_mission_count,
            self.completed_mission_count,
            self.failed_mission_count,
            self.not_submitted_mission_count,
            self.completion_rate,
        )
        expected_achieved = (
            self.total_mission_count > 0
            and self.completed_mission_count == self.total_mission_count
        )
        if self.achieved != expected_achieved:
            raise ValueError("achieved가 일일 미션 집계값과 일치하지 않습니다.")
        return self


class PersonalMissionTypeStat(ApiModel):
    mission_type: str = Field(min_length=1, max_length=100)
    total_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)
    failed_mission_count: int = Field(ge=0)
    not_submitted_mission_count: int = Field(ge=0)
    completion_rate: float = Field(ge=0.0, le=100.0)

    @model_validator(mode="after")
    def validate_aggregate(self):
        _validate_mission_aggregate(
            self.total_mission_count,
            self.completed_mission_count,
            self.failed_mission_count,
            self.not_submitted_mission_count,
            self.completion_rate,
        )
        return self


class PersonalSlotStat(ApiModel):
    slot: str = Field(min_length=1, max_length=50)
    total_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)
    failed_mission_count: int = Field(ge=0)
    not_submitted_mission_count: int = Field(ge=0)
    completion_rate: float = Field(ge=0.0, le=100.0)

    @model_validator(mode="after")
    def validate_aggregate(self):
        _validate_mission_aggregate(
            self.total_mission_count,
            self.completed_mission_count,
            self.failed_mission_count,
            self.not_submitted_mission_count,
            self.completion_rate,
        )
        return self


class PersonalWeeklyReportRequest(ApiModel):
    """BE C의 GET /api/v1/users/me/weekly-report-data 응답 data와 같은 구조."""

    user_id: ExternalId
    week_start_date: date
    week_end_date: date
    total_mission_count: int = Field(ge=0)
    completed_mission_count: int = Field(ge=0)
    failed_mission_count: int = Field(ge=0)
    not_submitted_mission_count: int = Field(ge=0)
    completion_rate: float = Field(ge=0.0, le=100.0)
    achieved_day_count: int = Field(ge=0, le=7)
    current_streak_days: int = Field(ge=0, le=7)
    longest_streak_days: int = Field(ge=0, le=7)
    daily_stats: List[PersonalDailyStat] = Field(min_length=7, max_length=7)
    mission_type_stats: List[PersonalMissionTypeStat] = Field(
        default_factory=list,
        max_length=100,
    )
    slot_stats: List[PersonalSlotStat] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def validate_aggregates(self):
        if self.week_end_date != self.week_start_date + timedelta(days=6):
            raise ValueError("weekEndDate는 weekStartDate로부터 6일 뒤여야 합니다.")

        _validate_mission_aggregate(
            self.total_mission_count,
            self.completed_mission_count,
            self.failed_mission_count,
            self.not_submitted_mission_count,
            self.completion_rate,
        )

        expected_dates = {
            self.week_start_date + timedelta(days=offset) for offset in range(7)
        }
        actual_dates = {stat.date for stat in self.daily_stats}
        if actual_dates != expected_dates:
            raise ValueError("dailyStats는 해당 주간의 날짜를 하루씩 포함해야 합니다.")

        if self.achieved_day_count != sum(stat.achieved for stat in self.daily_stats):
            raise ValueError("achievedDayCount가 dailyStats와 일치하지 않습니다.")
        if self.current_streak_days > self.longest_streak_days:
            raise ValueError("현재 연속 달성 일수는 최장 연속 달성 일수를 초과할 수 없습니다.")

        self._validate_stat_totals(self.daily_stats, "dailyStats")
        self._validate_stat_totals(self.mission_type_stats, "missionTypeStats")
        self._validate_stat_totals(self.slot_stats, "slotStats")

        mission_types = [stat.mission_type for stat in self.mission_type_stats]
        if len(mission_types) != len(set(mission_types)):
            raise ValueError("missionTypeStats의 missionType은 중복될 수 없습니다.")
        slots = [stat.slot for stat in self.slot_stats]
        if len(slots) != len(set(slots)):
            raise ValueError("slotStats의 slot은 중복될 수 없습니다.")
        return self

    def _validate_stat_totals(self, stats, field_name: str) -> None:
        expected = (
            self.total_mission_count,
            self.completed_mission_count,
            self.failed_mission_count,
            self.not_submitted_mission_count,
        )
        actual = (
            sum(stat.total_mission_count for stat in stats),
            sum(stat.completed_mission_count for stat in stats),
            sum(stat.failed_mission_count for stat in stats),
            sum(stat.not_submitted_mission_count for stat in stats),
        )
        if actual != expected:
            raise ValueError(f"{field_name}의 합계가 전체 주간 집계와 일치하지 않습니다.")


class PersonalWeeklyReportResponse(ApiModel):
    user_id: ExternalId
    week_start_date: date
    week_end_date: date
    summary_text: str = Field(min_length=1, max_length=500)
    encouragement_text: str = Field(min_length=1, max_length=300)
    report_source: Literal["AI", "FALLBACK"]
