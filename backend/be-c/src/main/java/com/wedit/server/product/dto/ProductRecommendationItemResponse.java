package com.wedit.server.product.dto;

import java.time.LocalDateTime;

public record ProductRecommendationItemResponse(
        Long recommendationId,
        Long groupId,
        String recommendationType,
        String category,
        String productName,
        String reason,
        LocalDateTime createdAt
) {
}
