package com.wedit.server.highlight.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record HighlightSaveRequest(
        Long userId,
        Long groupId,

        @NotNull(message = "하이라이트 날짜는 필수입니다.")
        LocalDate highlightDate,

        @NotBlank(message = "하이라이트 제목은 필수입니다.")
        @Size(max = 100, message = "하이라이트 제목은 100자 이하이어야 합니다.")
        String title,

        @Size(max = 500, message = "하이라이트 요약은 500자 이하이어야 합니다.")
        String summary,

        @NotBlank(message = "하이라이트 영상 URL은 필수입니다.")
        @Size(max = 500, message = "하이라이트 영상 URL은 500자 이하이어야 합니다.")
        String videoUrl
) {
}
