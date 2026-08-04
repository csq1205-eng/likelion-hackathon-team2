package com.welllog.server.user.dto;

import jakarta.validation.constraints.NotNull;

public record ConsentRequest(
        @NotNull(message = "필수 개인정보 처리 동의 여부는 필수입니다.")
        Boolean privacyRequiredAgreed
) {
}
