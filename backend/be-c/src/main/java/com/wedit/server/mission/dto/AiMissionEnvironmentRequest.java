package com.wedit.server.mission.dto;

public record AiMissionEnvironmentRequest(
        String weather,
        Double temperature,
        Double uvIndex,
        String fineDust
) {
}
