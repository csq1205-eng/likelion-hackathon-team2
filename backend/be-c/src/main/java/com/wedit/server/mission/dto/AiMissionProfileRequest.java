package com.wedit.server.mission.dto;

import java.util.List;

public record AiMissionProfileRequest(
        String skinType,
        List<String> concerns,
        Double sleepHours,
        List<String> habits,
        List<String> painAreas
) {
}
