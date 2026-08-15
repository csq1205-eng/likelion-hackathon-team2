package com.wedit.server.notification.dto;

public record PushTokenResponse(
        Long pushDeviceTokenId,
        Long userId,
        String platform,
        boolean active
) {
}
