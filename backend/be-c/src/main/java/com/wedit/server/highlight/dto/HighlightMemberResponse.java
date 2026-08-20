package com.wedit.server.highlight.dto;

public record HighlightMemberResponse(
        Long id,
        String name,
        String type,
        String itemType,
        String content,
        String mediaUrl,
        String time,
        boolean completed
) {
}
