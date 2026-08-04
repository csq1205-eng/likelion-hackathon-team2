package com.welllog.server.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record OnboardingRequest(
        @NotBlank(message = "주요 고민은 필수입니다.")
        String mainConcern,

        List<String> causeCandidates,

        @DecimalMin(value = "0.0", message = "수면 시간은 0 이상이어야 합니다.")
        @DecimalMax(value = "24.0", message = "수면 시간은 24 이하이어야 합니다.")
        BigDecimal sleepHours,

        @DecimalMin(value = "0.0", message = "물 섭취량은 0 이상이어야 합니다.")
        BigDecimal waterIntake,

        LocalTime wakeUpTime,

        LocalTime sleepTime,

        List<String> preferredMissionTypes,

        List<String> avoidedMissionTypes,

        @Valid
        @NotNull(message = "보유 제품 목록은 필수입니다.")
        List<OwnedProductRequest> ownedProducts
) {
}
