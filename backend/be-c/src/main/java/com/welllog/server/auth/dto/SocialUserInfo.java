package com.welllog.server.auth.dto;

import com.welllog.server.user.domain.SocialProvider;

public record SocialUserInfo(
        SocialProvider provider,
        String providerUserId,
        String email,
        String nickname,
        String profileImageUrl
) {
}
