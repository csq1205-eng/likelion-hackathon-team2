package com.wedit.server.point.dto;

public record PointRedeemResponse(
        Long redemptionId,
        String redemptionType,
        int pointAmount,
        String status,
        int balanceAfter
) {
}
