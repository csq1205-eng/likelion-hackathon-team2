package com.wedit.server.highlight.dto;

import java.time.LocalDate;

public record HighlightItemResponse(
        Long groupId,
        Long highlightId,
        LocalDate highlightDate,
        String title,
        String summary,
        String videoUrl
) {
}
