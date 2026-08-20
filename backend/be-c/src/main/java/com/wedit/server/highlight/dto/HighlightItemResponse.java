package com.wedit.server.highlight.dto;

import java.time.LocalDate;
import java.util.List;

public record HighlightItemResponse(
        Long groupId,
        Long highlightId,
        LocalDate highlightDate,
        String title,
        String summary,
        String videoUrl,
        List<HighlightMemberResponse> members
) {
}
