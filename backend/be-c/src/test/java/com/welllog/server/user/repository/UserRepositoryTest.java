package com.welllog.server.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.welllog.server.user.domain.SocialProvider;
import com.welllog.server.user.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("소셜 로그인 제공자와 소셜 ID로 사용자를 조회한다")
    void findBySocialProviderAndSocialId() {
        User user = User.create(
                SocialProvider.KAKAO,
                "12345",
                "welllog@example.com",
                "정효림",
                "https://example.com/profile.png"
        );

        userRepository.save(user);

        User foundUser = userRepository.findBySocialProviderAndSocialId(SocialProvider.KAKAO, "12345")
                .orElseThrow();

        assertThat(foundUser.getEmail()).isEqualTo("welllog@example.com");
        assertThat(foundUser.isOnboardingCompleted()).isFalse();
    }
}
