package com.wedit.server.group.dto;

import java.util.List;

public record GroupListResponse(
        List<GroupSummaryResponse> groups
) {
}
