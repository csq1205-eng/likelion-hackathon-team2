package com.wedit.server.report.dto;

public record WeeklyMissionTypeReportDataResponse(
        String missionType,
        int totalMissionCount,
        int completedMissionCount,
        int failedMissionCount,
        int notSubmittedMissionCount,
        double completionRate
) {
}
