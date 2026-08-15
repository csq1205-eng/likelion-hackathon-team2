package com.wedit.server.mission.dto;

import java.util.List;

public record AiMissionItemResponse(
        String title,
        String description,
        String slot,
        String missionType,
        String difficulty,
        Integer durationMinutes,
        String reason,
        List<AiVerificationCriteriaResponse> verificationCriteria
) {
}
