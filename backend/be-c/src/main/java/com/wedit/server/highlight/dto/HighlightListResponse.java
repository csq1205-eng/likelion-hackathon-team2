package com.wedit.server.highlight.dto;

import java.util.List;

public record HighlightListResponse(
        List<HighlightItemResponse> items
) {
}
