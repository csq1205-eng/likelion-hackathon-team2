package com.welllog.server.group.dto;

import java.time.LocalDateTime;

public record GroupJoinResponse(
        Long groupId,
        Long userId,
        String role,
        LocalDateTime joinedAt
) {
}
