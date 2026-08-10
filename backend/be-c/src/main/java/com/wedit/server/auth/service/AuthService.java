package com.wedit.server.auth.service;

import com.wedit.server.auth.domain.UserSession;
import com.wedit.server.auth.dto.LoginRequest;
import com.wedit.server.auth.dto.LoginResponse;
import com.wedit.server.auth.dto.SocialUserInfo;
import com.wedit.server.auth.repository.UserSessionRepository;
import com.wedit.server.point.domain.UserPoint;
import com.wedit.server.point.repository.UserPointRepository;
import com.wedit.server.user.domain.UserConsent;
import com.wedit.server.user.domain.UserSocialAccount;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserConsentRepository;
import com.wedit.server.user.repository.UserRepository;
import com.wedit.server.user.repository.UserSocialAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String TOKEN_TYPE = "Bearer";
    private static final int REFRESH_TOKEN_EXPIRE_DAYS = 14;

    private final UserRepository userRepository;
    private final UserSocialAccountRepository userSocialAccountRepository;
    private final UserSessionRepository userSessionRepository;
    private final UserConsentRepository userConsentRepository;
    private final UserPointRepository userPointRepository;
    private final SocialTokenVerifier socialTokenVerifier;

    public AuthService(
            UserRepository userRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            UserSessionRepository userSessionRepository,
            UserConsentRepository userConsentRepository,
            UserPointRepository userPointRepository,
            SocialTokenVerifier socialTokenVerifier
    ) {
        this.userRepository = userRepository;
        this.userSocialAccountRepository = userSocialAccountRepository;
        this.userSessionRepository = userSessionRepository;
        this.userConsentRepository = userConsentRepository;
        this.userPointRepository = userPointRepository;
        this.socialTokenVerifier = socialTokenVerifier;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        SocialUserInfo socialUserInfo = socialTokenVerifier.verify(request.provider(), request.socialAccessToken());

        return userSocialAccountRepository
                .findByProviderAndProviderUserId(socialUserInfo.provider(), socialUserInfo.providerUserId())
                .map(socialAccount -> toLoginResponse(socialAccount.getUser(), false))
                .orElseGet(() -> toLoginResponse(createUser(socialUserInfo), true));
    }

    private User createUser(SocialUserInfo socialUserInfo) {
        User user = User.create(
                socialUserInfo.provider(),
                socialUserInfo.providerUserId(),
                socialUserInfo.email(),
                socialUserInfo.nickname(),
                socialUserInfo.profileImageUrl()
        );

        User savedUser = userRepository.save(user);
        userSocialAccountRepository.save(UserSocialAccount.create(
                savedUser,
                socialUserInfo.provider(),
                socialUserInfo.providerUserId()
        ));
        userConsentRepository.save(UserConsent.createDefault(savedUser));
        userPointRepository.save(UserPoint.create(savedUser));

        return savedUser;
    }

    private LoginResponse toLoginResponse(User user, boolean isNewUser) {
        String accessToken = createTemporaryAccessToken(user);
        String refreshToken = createRefreshToken();

        userSessionRepository.save(UserSession.create(
                user,
                hash(refreshToken),
                LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRE_DAYS)
        ));

        boolean requiredConsentCompleted = userConsentRepository.findByUser(user)
                .map(UserConsent::isRequiredConsentCompleted)
                .orElse(false);

        return new LoginResponse(
                user.getId(),
                accessToken,
                refreshToken,
                TOKEN_TYPE,
                isNewUser,
                user.isOnboardingCompleted(),
                requiredConsentCompleted
        );
    }

    private String createTemporaryAccessToken(User user) {
        return "temporary-token-" + user.getId();
    }

    private String createRefreshToken() {
        return "refresh-" + UUID.randomUUID();
    }

    private String hash(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }
}
