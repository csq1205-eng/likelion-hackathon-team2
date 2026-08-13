package com.wedit.server.group.dto;

import java.time.LocalDateTime;

public record GardenCompletionResponse(
        Long groupId,
        Long userId,
        boolean completed,
        boolean newlyCompleted,
        String groupStatus,
        LocalDateTime completedAt,
        int targetDays,
        int personalStampCount,
        int groupStampCount,
        RewardClaimResponse reward
) {
}
