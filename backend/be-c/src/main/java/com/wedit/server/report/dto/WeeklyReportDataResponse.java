package com.wedit.server.report.dto;

import java.time.LocalDate;
import java.util.List;

public record WeeklyReportDataResponse(
        Long userId,
        LocalDate weekStartDate,
        LocalDate weekEndDate,
        int totalMissionCount,
        int completedMissionCount,
        int failedMissionCount,
        int notSubmittedMissionCount,
        double completionRate,
        int achievedDayCount,
        int currentStreakDays,
        int longestStreakDays,
        List<WeeklyDailyReportDataResponse> dailyStats,
        List<WeeklyMissionTypeReportDataResponse> missionTypeStats,
        List<WeeklySlotReportDataResponse> slotStats
) {
}
