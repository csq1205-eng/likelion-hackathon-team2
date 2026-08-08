package com.welllog.server.user.dto;

public record OnboardingResponse(
        Long userId,
        boolean onboardingCompleted
) {
}
