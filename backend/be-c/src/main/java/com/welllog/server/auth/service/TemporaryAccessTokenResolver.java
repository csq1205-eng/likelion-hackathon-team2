package com.welllog.server.auth.service;

import com.welllog.server.common.CustomException;
import com.welllog.server.common.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class TemporaryAccessTokenResolver {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String TEMPORARY_TOKEN_PREFIX = "temporary-token-";

    public Long resolveUserId(String authorizationHeader) {
        String normalizedHeader = normalizeAuthorizationHeader(authorizationHeader);

        if (normalizedHeader == null || !normalizedHeader.startsWith(BEARER_PREFIX)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        String accessToken = normalizedHeader.substring(BEARER_PREFIX.length());

        if (!accessToken.startsWith(TEMPORARY_TOKEN_PREFIX)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        try {
            return Long.parseLong(accessToken.substring(TEMPORARY_TOKEN_PREFIX.length()));
        } catch (NumberFormatException e) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
    }

    private String normalizeAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null) {
            return null;
        }

        String trimmedHeader = authorizationHeader.trim();
        if (trimmedHeader.regionMatches(true, 0, "Authorization:", 0, "Authorization:".length())) {
            return trimmedHeader.substring("Authorization:".length()).trim();
        }

        return trimmedHeader;
    }
}
