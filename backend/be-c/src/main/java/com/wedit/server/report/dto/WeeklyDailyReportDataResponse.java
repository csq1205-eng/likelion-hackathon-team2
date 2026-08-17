package com.wedit.server.report.dto;

import java.time.LocalDate;

public record WeeklyDailyReportDataResponse(
        LocalDate date,
        int totalMissionCount,
        int completedMissionCount,
        int failedMissionCount,
        int notSubmittedMissionCount,
        double completionRate,
        boolean achieved
) {
}
