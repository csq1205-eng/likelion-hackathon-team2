package com.wedit.server.notification.dto;

import java.time.LocalDateTime;

public record NotificationItemResponse(
        Long notificationId,
        String title,
        String body,
        String notificationType,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
}
