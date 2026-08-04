package com.welllog.server.group.dto;

import java.util.List;

public record GroupInvitePreviewResponse(
        Long groupId,
        String name,
        String goalName,
        int memberCount,
        List<GroupPreviewMemberResponse> members,
        boolean joinable
) {
}
