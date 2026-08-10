package com.wedit.server.group.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record GroupCreateRequest(
        @NotBlank(message = "그룹명은 필수입니다.")
        String name,

        @NotBlank(message = "그룹 목표명은 필수입니다.")
        String goalName,

        @Min(value = 1, message = "목표 달성 기준 일수는 1일 이상이어야 합니다.")
        @Max(value = 365, message = "목표 달성 기준 일수는 365일 이하이어야 합니다.")
        int targetDays
) {
}
