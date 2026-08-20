package com.wedit.server.highlight.dto;

import java.util.List;

public record AiHighlightGenerateResponse(
        Long highlightId,
        Long groupId,
        String status,
        String videoUrl,
        double durationSeconds,
        List<Long> notifiedClipIds,
        List<Long> failedClipIds,
        String callbackStatus
) {
}
