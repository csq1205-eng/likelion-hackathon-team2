package com.wedit.server.point.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record PointRedeemRequest(
        @NotBlank String redemptionType,
        @Min(1) int pointAmount
) {
}
