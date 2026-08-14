package com.wedit.server.mission.dto;

import java.time.LocalDate;
import java.util.List;

public record MissionGenerationResponse(
        Long userId,
        Long groupId,
        LocalDate date,
        int createdCount,
        List<Long> missionIds
) {
}
