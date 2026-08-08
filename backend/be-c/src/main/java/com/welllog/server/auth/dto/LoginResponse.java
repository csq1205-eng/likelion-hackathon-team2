package com.welllog.server.auth.dto;

public record LoginResponse(
        Long userId,
        String accessToken,
        String refreshToken,
        String tokenType,
        boolean isNewUser,
        boolean onboardingCompleted,
        boolean requiredConsentCompleted
) {
}
