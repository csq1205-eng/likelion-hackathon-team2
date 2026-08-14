package com.wedit.server.mission.dto;

import java.util.List;
import java.util.Map;

public record AiMissionGenerateResponse(
        Long userId,
        List<AiMissionItemResponse> missions,
        Map<String, List<String>> appliedFilters,
        String generationMode
) {
}
