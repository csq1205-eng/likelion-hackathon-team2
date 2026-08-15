package com.wedit.server.point.dto;

import java.time.LocalDateTime;

public record PointTransactionResponse(
        Long transactionId,
        String transactionType,
        int amount,
        String reason,
        LocalDateTime createdAt
) {
}
