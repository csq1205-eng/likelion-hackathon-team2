package com.wedit.server.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.auth.dto.LoginRequest;
import com.wedit.server.auth.dto.LoginResponse;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.repository.UserRepository;
import com.wedit.server.user.repository.UserSocialAccountRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSocialAccountRepository userSocialAccountRepository;

    @Test
    @DisplayName("신규 소셜 로그인 사용자는 새 사용자로 저장하고 Wedit 토큰을 발급한다")
    void loginNewUser() {
        LoginRequest request = new LoginRequest(
                SocialProvider.KAKAO,
                "kakao:12345"
        );

        LoginResponse response = authService.login(request);

        assertThat(response.userId()).isNotNull();
        assertThat(response.accessToken()).isEqualTo("temporary-token-" + response.userId());
        assertThat(response.refreshToken()).startsWith("refresh-");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.isNewUser()).isTrue();
        assertThat(response.onboardingCompleted()).isFalse();
        assertThat(response.requiredConsentCompleted()).isFalse();
        assertThat(userRepository.existsBySocialProviderAndSocialId(SocialProvider.KAKAO, "12345")).isTrue();
        assertThat(userSocialAccountRepository.findByProviderAndProviderUserId(SocialProvider.KAKAO, "12345")).isPresent();
    }

    @Test
    @DisplayName("이미 가입된 소셜 로그인 사용자는 기존 사용자로 로그인한다")
    void loginExistingUser() {
        LoginRequest request = new LoginRequest(
                SocialProvider.GOOGLE,
                "google:12345"
        );

        LoginResponse firstResponse = authService.login(request);
        LoginResponse secondResponse = authService.login(request);

        assertThat(secondResponse.userId()).isEqualTo(firstResponse.userId());
        assertThat(secondResponse.isNewUser()).isFalse();
        assertThat(secondResponse.refreshToken()).startsWith("refresh-");
    }
}
