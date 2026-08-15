package com.wedit.server.user.dto;

import java.util.List;

public record MissionHistoryResponse(
        Long userId,
        int year,
        int month,
        List<MissionHistoryDayResponse> days
) {
}
