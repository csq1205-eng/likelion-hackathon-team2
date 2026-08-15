package com.wedit.server.user.dto;

public record WithdrawalCleanupResponse(
        Long userId,
        Long withdrawalId,
        int deletedClipCount,
        int deletedFrameCount,
        String cleanupStatus,
        boolean idempotent
) {
}
