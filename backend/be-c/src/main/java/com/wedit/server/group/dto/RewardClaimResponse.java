package com.wedit.server.group.dto;

public record RewardClaimResponse(
        Long groupId,
        Long userId,
        boolean eligible,
        boolean newlyGranted,
        Long rewardGrantId,
        Long rewardId,
        String rewardName,
        int requiredPersonalStampCount,
        int personalStampCount,
        int requiredGroupStampCount,
        int groupStampCount,
        String reason
) {
}
