package com.wedit.server.group.dto;

public record GroupCreateResponse(
        Long groupId,
        String name,
        String goalName,
        int targetDays,
        String inviteCode
) {
}
