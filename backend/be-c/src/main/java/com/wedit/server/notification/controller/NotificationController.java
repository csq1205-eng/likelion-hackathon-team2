package com.wedit.server.notification.controller;

import com.wedit.server.common.ApiResponse;
import com.wedit.server.notification.dto.NotificationReadResponse;
import com.wedit.server.notification.service.NotificationService;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationReadResponse> readNotification(@PathVariable Long notificationId) {
        return ApiResponse.success(notificationService.readNotification(notificationId));
    }
}
