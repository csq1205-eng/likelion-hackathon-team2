package com.wedit.server.user.dto;

public record UserWithdrawalResponse(
        Long userId,
        Long withdrawalId,
        String withdrawalStatus
) {
}
