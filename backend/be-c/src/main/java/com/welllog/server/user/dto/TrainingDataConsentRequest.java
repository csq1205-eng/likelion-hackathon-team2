package com.welllog.server.user.dto;

import jakarta.validation.constraints.NotNull;

public record TrainingDataConsentRequest(
        @NotNull(message = "학습용 데이터 활용 동의 여부는 필수입니다.")
        Boolean trainingDataAgreed
) {
}
