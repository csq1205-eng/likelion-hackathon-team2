package com.wedit.server.user.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserConsent;
import com.wedit.server.user.dto.ConsentRequest;
import com.wedit.server.user.dto.ConsentResponse;
import com.wedit.server.user.dto.TrainingDataConsentRequest;
import com.wedit.server.user.dto.TrainingDataConsentResponse;
import com.wedit.server.user.repository.UserConsentRepository;
import com.wedit.server.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserConsentServiceTest {

    @Autowired
    private UserConsentService userConsentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserConsentRepository userConsentRepository;

    @Test
    @DisplayName("필수 개인정보 처리 동의를 저장한다")
    void updatePrivacyConsent() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-privacy-1",
                "privacy@example.com",
                "정효림",
                null
        ));
        userConsentRepository.save(UserConsent.createDefault(user));

        ConsentResponse response = userConsentService.updatePrivacyConsent(
                user.getId(),
                new ConsentRequest(true)
        );

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.privacyRequiredAgreed()).isTrue();
        assertThat(response.privacyAgreedAt()).isNotNull();
        assertThat(userConsentRepository.findByUser(user).orElseThrow().isRequiredConsentCompleted()).isTrue();
    }

    @Test
    @DisplayName("학습용 데이터 활용 동의를 저장한다")
    void updateTrainingDataConsent() {
        User user = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-training-1",
                "training@example.com",
                "정효림",
                null
        ));
        userConsentRepository.save(UserConsent.createDefault(user));

        TrainingDataConsentResponse response = userConsentService.updateTrainingDataConsent(
                user.getId(),
                new TrainingDataConsentRequest(true)
        );

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.trainingDataAgreed()).isTrue();
        assertThat(response.trainingDataAgreedAt()).isNotNull();
        assertThat(userConsentRepository.findByUser(user).orElseThrow().isTrainingDataAgreed()).isTrue();
    }
}
