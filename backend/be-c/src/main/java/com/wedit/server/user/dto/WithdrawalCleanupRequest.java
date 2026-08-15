package com.wedit.server.user.dto;

import java.time.LocalDateTime;

public record WithdrawalCleanupRequest(
        Long userId,
        Long withdrawalId,
        LocalDateTime requestedAt
) {
}
