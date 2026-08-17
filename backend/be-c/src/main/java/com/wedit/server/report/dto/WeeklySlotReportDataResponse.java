package com.wedit.server.report.dto;

public record WeeklySlotReportDataResponse(
        String slot,
        int totalMissionCount,
        int completedMissionCount,
        int failedMissionCount,
        int notSubmittedMissionCount,
        double completionRate
) {
}
