package com.wedit.server.mission.dto;

import java.time.LocalDate;
import java.util.List;

public record TodayMissionResponse(
        LocalDate date,
        List<TodayMissionItemResponse> missions
) {
}
