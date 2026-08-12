package com.wedit.server.mission.dto;

public record TodayMissionItemResponse(
        Long missionId,
        String slot,
        String title,
        String description,
        String missionType,
        String verificationCriteria,
        String status,
        String reason
) {
}
