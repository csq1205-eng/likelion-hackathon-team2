package com.welllog.server.auth.service;

import com.welllog.server.auth.dto.SocialUserInfo;
import com.welllog.server.user.domain.SocialProvider;

public interface SocialTokenVerifier {

    SocialUserInfo verify(SocialProvider provider, String socialAccessToken);
}
