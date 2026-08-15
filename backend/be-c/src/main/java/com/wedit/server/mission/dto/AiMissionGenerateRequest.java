package com.wedit.server.mission.dto;

import java.util.List;

public record AiMissionGenerateRequest(
        Long userId,
        String goal,
        AiMissionProfileRequest profile,
        AiMissionEnvironmentRequest environment,
        List<String> excludedMissions,
        int maxMissions
) {
}
