package com.wedit.server.product.dto;

import java.util.List;

public record ProductRecommendationListResponse(
        Long userId,
        List<ProductRecommendationItemResponse> recommendations
) {
}
