package com.wedit.server.highlight.dto;

public record AiHighlightClipRequest(
        Long clipId,
        boolean shared,
        String sourceUrl,
        String caption
) {
}
