package com.wedit.server.reward.dto;

import java.time.LocalDateTime;

public record RewardGrantItemResponse(
        Long rewardGrantId,
        Long rewardId,
        Long groupId,
        String rewardName,
        String rewardType,
        String status,
        LocalDateTime grantedAt
) {
}
