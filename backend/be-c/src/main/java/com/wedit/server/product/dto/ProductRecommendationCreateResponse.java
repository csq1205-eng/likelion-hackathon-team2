package com.wedit.server.product.dto;

import java.util.List;

public record ProductRecommendationCreateResponse(
        Long userId,
        String recommendationType,
        int createdCount,
        List<ProductRecommendationItemResponse> recommendations
) {
}
