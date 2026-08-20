package com.wedit.server.highlight.dto;

import java.time.LocalDateTime;

public record HighlightMemberMissionRow(
        Long userId,
        String nickname,
        String missionTitle,
        LocalDateTime judgedAt
) {
}
