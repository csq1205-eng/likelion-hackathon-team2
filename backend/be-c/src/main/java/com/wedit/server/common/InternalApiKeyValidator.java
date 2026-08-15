package com.wedit.server.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalApiKeyValidator {

    private final String internalKey;

    public InternalApiKeyValidator(@Value("${app.ai.internal-key:}") String internalKey) {
        this.internalKey = internalKey;
    }

    public void validate(String requestKey) {
        if (internalKey == null || internalKey.isBlank()) {
            return;
        }
        if (requestKey == null || requestKey.isBlank()) {
            throw new CustomException(ErrorCode.FORBIDDEN, "내부 API 키가 올바르지 않습니다.");
        }

        byte[] expected = internalKey.getBytes(StandardCharsets.UTF_8);
        byte[] actual = requestKey.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new CustomException(ErrorCode.FORBIDDEN, "내부 API 키가 올바르지 않습니다.");
        }
    }
}
