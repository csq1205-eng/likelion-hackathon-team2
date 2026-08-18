package com.wedit.server.notification.dto;

import java.time.LocalDateTime;

public record NotificationCreateResponse(
        Long notificationId,
        Long userId,
        String title,
        String body,
        String notificationType,
        boolean read,
        LocalDateTime createdAt
) {
}
