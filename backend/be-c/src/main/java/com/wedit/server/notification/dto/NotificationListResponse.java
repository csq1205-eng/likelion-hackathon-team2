package com.wedit.server.notification.dto;

import java.util.List;

public record NotificationListResponse(
        List<NotificationItemResponse> items
) {
}
