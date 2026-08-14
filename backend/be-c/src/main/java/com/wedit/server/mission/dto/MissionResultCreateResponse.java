package com.wedit.server.mission.dto;

public record MissionResultCreateResponse(
        Long missionResultId,
        Long missionId,
        Long clipId,
        Long userId,
        String result
) {
}
