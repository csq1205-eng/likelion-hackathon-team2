package com.wedit.server.reward.dto;

import java.util.List;

public record RewardGrantListResponse(
        Long userId,
        List<RewardGrantItemResponse> rewards
) {
}
