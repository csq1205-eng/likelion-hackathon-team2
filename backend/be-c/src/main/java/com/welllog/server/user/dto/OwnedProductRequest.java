package com.welllog.server.user.dto;

import com.welllog.server.user.domain.ProductCategory;
import jakarta.validation.constraints.NotNull;

public record OwnedProductRequest(
        @NotNull(message = "제품 카테고리는 필수입니다.")
        ProductCategory category,

        @NotNull(message = "제품 보유 여부는 필수입니다.")
        Boolean hasProduct
) {
}
