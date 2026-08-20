package com.wedit.server.highlight.dto;

import java.util.List;

public record AiHighlightGenerateRequest(
        Long highlightId,
        Long groupId,
        String title,
        List<AiHighlightClipRequest> clips,
        int maxDurationSeconds
) {
}
