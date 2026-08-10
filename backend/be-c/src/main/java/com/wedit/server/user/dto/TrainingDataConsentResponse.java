package com.wedit.server.user.dto;

import java.time.LocalDateTime;

public record TrainingDataConsentResponse(
        Long userId,
        boolean trainingDataAgreed,
        LocalDateTime trainingDataAgreedAt
) {
}
