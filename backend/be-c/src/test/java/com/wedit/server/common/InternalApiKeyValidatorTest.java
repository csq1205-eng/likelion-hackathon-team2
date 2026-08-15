package com.wedit.server.common;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InternalApiKeyValidatorTest {

    @Test
    @DisplayName("내부 API 키가 일치하면 통과한다")
    void validate() {
        InternalApiKeyValidator validator = new InternalApiKeyValidator("secret-key");

        assertThatCode(() -> validator.validate("secret-key"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("내부 API 키가 설정되어 있고 요청 키가 없거나 일치하지 않으면 거부한다")
    void validateInvalidKey() {
        InternalApiKeyValidator validator = new InternalApiKeyValidator("secret-key");

        assertThatThrownBy(() -> validator.validate("wrong-key"))
                .isInstanceOf(CustomException.class);
        assertThatThrownBy(() -> validator.validate(null))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("내부 API 키가 설정되지 않으면 로컬 개발 흐름을 위해 검증을 생략한다")
    void validateSkippedWhenInternalKeyIsBlank() {
        InternalApiKeyValidator validator = new InternalApiKeyValidator("");

        assertThatCode(() -> validator.validate(null))
                .doesNotThrowAnyException();
    }
}
