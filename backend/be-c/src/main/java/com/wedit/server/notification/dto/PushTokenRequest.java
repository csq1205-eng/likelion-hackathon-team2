package com.wedit.server.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record PushTokenRequest(
        @NotBlank String deviceToken,
        @NotBlank String platform,
        String deviceId
) {
}
