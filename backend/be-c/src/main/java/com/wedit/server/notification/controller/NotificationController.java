package com.wedit.server.notification.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.notification.dto.NotificationReadResponse;
import com.wedit.server.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public NotificationController(
            NotificationService notificationService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.notificationService = notificationService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @PatchMapping("/{notificationId}/read")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<NotificationReadResponse> readNotification(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long notificationId
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(notificationService.readNotification(userId, notificationId));
    }
}
