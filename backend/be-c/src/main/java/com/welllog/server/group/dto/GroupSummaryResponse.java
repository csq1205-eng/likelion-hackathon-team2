package com.welllog.server.group.dto;

public record GroupSummaryResponse(
        Long groupId,
        String name,
        String goalName,
        int targetDays,
        int memberCount,
        int todayCompletedCount,
        int todayTotalCount,
        double progressRate
) {
}
