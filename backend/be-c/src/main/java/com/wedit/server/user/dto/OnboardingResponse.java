package com.wedit.server.user.dto;

public record OnboardingResponse(
        Long userId,
        boolean onboardingCompleted
) {
}
