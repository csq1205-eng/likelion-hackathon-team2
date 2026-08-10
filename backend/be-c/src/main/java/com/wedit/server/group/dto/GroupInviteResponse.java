package com.wedit.server.group.dto;

import java.time.LocalDateTime;

public record GroupInviteResponse(
        Long groupId,
        String inviteCode,
        String inviteUrl,
        String qrImageUrl,
        LocalDateTime expiresAt
) {
}
