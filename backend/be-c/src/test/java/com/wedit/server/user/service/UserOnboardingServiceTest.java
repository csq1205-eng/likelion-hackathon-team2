package com.wedit.server.user.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.user.domain.ProductCategory;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.dto.OnboardingRequest;
import com.wedit.server.user.dto.OnboardingResponse;
import com.wedit.server.user.dto.OwnedProductRequest;
import com.wedit.server.user.repository.UserMissionPreferenceRepository;
import com.wedit.server.user.repository.UserOnboardingProfileRepository;
import com.wedit.server.user.repository.UserOwnedProductRepository;
import com.wedit.server.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserOnboardingServiceTest {

    @Autowired
    private UserOnboardingService userOnboardingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserOnboardingProfileRepository userOnboardingProfileRepository;

    @Autowired
    private UserMissionPreferenceRepository userMissionPreferenceRepository;

    @Autowired
    private UserOwnedProductRepository userOwnedProductRepository;

    @Test
    @DisplayName("온보딩 정보를 저장하고 사용자 온보딩 완료 상태를 변경한다")
    void saveOnboarding() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-onboarding-1",
                "onboarding@example.com",
                "정효림",
                null
        ));

        OnboardingRequest request = new OnboardingRequest(
                "TROUBLE",
                List.of("SLEEP_LACK", "STRESS"),
                new BigDecimal("6.5"),
                new BigDecimal("1.2"),
                LocalTime.of(7, 30),
                LocalTime.of(1, 0),
                List.of("HYDRATION", "CLEANSING"),
                List.of("OUTDOOR"),
                List.of(
                        new OwnedProductRequest(ProductCategory.SKINCARE, true),
                        new OwnedProductRequest(ProductCategory.BODY, false)
                )
        );

        OnboardingResponse response = userOnboardingService.saveOnboarding(user.getId(), request);

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.onboardingCompleted()).isTrue();
        assertThat(user.isOnboardingCompleted()).isTrue();
        assertThat(userOnboardingProfileRepository.findByUser(user).orElseThrow().getMainConcern())
                .isEqualTo("TROUBLE");
        assertThat(userMissionPreferenceRepository.findByUser(user).orElseThrow().getPreferredMissionTypes())
                .containsExactly("HYDRATION", "CLEANSING");
        assertThat(userOwnedProductRepository.findAllByUser(user)).hasSize(2);
    }
}
