package com.wedit.server.notification.dto;

public record NotificationReadResponse(
        Long notificationId,
        boolean read
) {
}
