package com.wedit.server.auth.dto;

import com.wedit.server.user.domain.SocialProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
        @NotNull(message = "소셜 로그인 제공자는 필수입니다.")
        SocialProvider provider,

        @NotBlank(message = "소셜 Access Token은 필수입니다.")
        String socialAccessToken
) {
}
