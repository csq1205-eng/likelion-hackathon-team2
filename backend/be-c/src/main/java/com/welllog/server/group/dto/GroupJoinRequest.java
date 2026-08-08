package com.welllog.server.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GroupJoinRequest(
        @NotBlank(message = "초대 코드는 필수입니다.")
        @Pattern(regexp = "\\d{6}", message = "초대 코드는 6자리 숫자여야 합니다.")
        String inviteCode
) {
}
