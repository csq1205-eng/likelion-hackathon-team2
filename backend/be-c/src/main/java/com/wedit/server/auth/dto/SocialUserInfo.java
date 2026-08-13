package com.wedit.server.auth.dto;

import com.wedit.server.user.domain.SocialProvider;

public record SocialUserInfo(
        SocialProvider provider,
        String providerUserId,
        String email,
        String nickname,
        String profileImageUrl
) {
}
