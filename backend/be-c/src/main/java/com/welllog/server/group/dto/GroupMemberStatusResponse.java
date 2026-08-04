package com.welllog.server.group.dto;

public record GroupMemberStatusResponse(
        Long userId,
        String nickname,
        int completedMissionCount,
        int requiredMissionCount,
        boolean completed
) {
}
