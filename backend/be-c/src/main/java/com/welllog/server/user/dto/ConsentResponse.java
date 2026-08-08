package com.welllog.server.user.dto;

import java.time.LocalDateTime;

public record ConsentResponse(
        Long userId,
        boolean privacyRequiredAgreed,
        LocalDateTime privacyAgreedAt
) {
}
