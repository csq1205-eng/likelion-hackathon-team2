package com.wedit.server.report.dto;

import com.wedit.server.mission.domain.MissionResultType;
import java.time.LocalDate;

public record WeeklyMissionResultRow(
        Long missionId,
        LocalDate missionDate,
        String slot,
        String missionType,
        MissionResultType result
) {
}
