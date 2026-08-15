package com.wedit.server.mission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MissionResultCreateRequest(
        @NotNull Long missionId,
        Long clipId,
        @NotBlank String result,
        String reason,
        BigDecimal confidenceScore,
        String promptVersion,
        String modelVersion,
        LocalDateTime judgedAt
) {
}
