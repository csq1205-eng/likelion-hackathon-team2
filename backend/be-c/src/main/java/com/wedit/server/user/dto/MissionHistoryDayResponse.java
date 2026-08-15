package com.wedit.server.user.dto;

import java.time.LocalDate;

public record MissionHistoryDayResponse(
        LocalDate date,
        int completedMissionCount,
        int totalMissionCount,
        boolean completed
) {
}
