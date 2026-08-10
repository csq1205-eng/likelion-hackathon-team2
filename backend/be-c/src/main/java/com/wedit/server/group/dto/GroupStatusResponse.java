package com.wedit.server.group.dto;

import java.time.LocalDate;
import java.util.List;

public record GroupStatusResponse(
        Long groupId,
        LocalDate date,
        int memberCount,
        int completedMemberCount,
        double completionRate,
        boolean allCompleted,
        List<GroupMemberStatusResponse> members
) {
}
