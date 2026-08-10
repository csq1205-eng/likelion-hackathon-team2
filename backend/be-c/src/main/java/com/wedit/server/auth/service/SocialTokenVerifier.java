package com.wedit.server.auth.service;

import com.wedit.server.auth.dto.SocialUserInfo;
import com.wedit.server.user.domain.SocialProvider;

public interface SocialTokenVerifier {

    SocialUserInfo verify(SocialProvider provider, String socialAccessToken);
}
