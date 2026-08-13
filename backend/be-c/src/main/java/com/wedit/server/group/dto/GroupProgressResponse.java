package com.wedit.server.group.dto;

public record GroupProgressResponse(
        Long groupId,
        String name,
        String goalName,
        int targetDays,
        int completedDays,
        int remainingDays,
        double progressRate,
        boolean completed,
        int personalStampCount,
        int groupStampCount
) {
}
