package com.wedit.server.point.dto;

import java.util.List;

public record PointResponse(
        Long userId,
        int balance,
        int totalEarned,
        int totalUsed,
        List<PointTransactionResponse> recentTransactions
) {
}
