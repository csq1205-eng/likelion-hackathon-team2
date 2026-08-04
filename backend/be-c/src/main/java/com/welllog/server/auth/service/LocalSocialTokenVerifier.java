package com.welllog.server.auth.service;

import com.welllog.server.auth.dto.SocialUserInfo;
import com.welllog.server.common.CustomException;
import com.welllog.server.common.ErrorCode;
import com.welllog.server.user.domain.SocialProvider;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class LocalSocialTokenVerifier implements SocialTokenVerifier {

    private static final String TOKEN_SEPARATOR = ":";

    @Override
    public SocialUserInfo verify(SocialProvider provider, String socialAccessToken) {
        if (socialAccessToken == null || socialAccessToken.isBlank()) {
            throw new CustomException(ErrorCode.UNAUTHORIZED, "소셜 Access Token이 유효하지 않습니다.");
        }

        String providerUserId = extractProviderUserId(provider, socialAccessToken);

        return new SocialUserInfo(
                provider,
                providerUserId,
                providerUserId + "@local.welllog",
                provider.name().toLowerCase() + "_" + providerUserId,
                null
        );
    }

    private String extractProviderUserId(SocialProvider provider, String socialAccessToken) {
        String prefix = provider.name().toLowerCase() + TOKEN_SEPARATOR;
        if (socialAccessToken.startsWith(prefix)) {
            String tokenValue = socialAccessToken.substring(prefix.length());
            if (!tokenValue.isBlank()) {
                return tokenValue;
            }
        }

        return Integer.toHexString(socialAccessToken.hashCode());
    }
}
