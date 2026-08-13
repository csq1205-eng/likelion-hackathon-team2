package com.wedit.server.user.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserConsent;
import com.wedit.server.user.dto.ConsentRequest;
import com.wedit.server.user.dto.ConsentResponse;
import com.wedit.server.user.dto.TrainingDataConsentRequest;
import com.wedit.server.user.dto.TrainingDataConsentResponse;
import com.wedit.server.user.repository.UserConsentRepository;
import com.wedit.server.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserConsentService {

    private final UserRepository userRepository;
    private final UserConsentRepository userConsentRepository;

    public UserConsentService(
            UserRepository userRepository,
            UserConsentRepository userConsentRepository
    ) {
        this.userRepository = userRepository;
        this.userConsentRepository = userConsentRepository;
    }

    @Transactional
    public ConsentResponse updatePrivacyConsent(Long userId, ConsentRequest request) {
        UserConsent consent = findOrCreateConsent(userId);

        consent.updatePrivacyRequiredAgreement(request.privacyRequiredAgreed());

        return new ConsentResponse(
                consent.getUser().getId(),
                consent.isPrivacyRequiredAgreed(),
                consent.getPrivacyAgreedAt()
        );
    }

    @Transactional
    public TrainingDataConsentResponse updateTrainingDataConsent(
            Long userId,
            TrainingDataConsentRequest request
    ) {
        UserConsent consent = findOrCreateConsent(userId);

        consent.updateTrainingDataAgreement(request.trainingDataAgreed());

        return new TrainingDataConsentResponse(
                consent.getUser().getId(),
                consent.isTrainingDataAgreed(),
                consent.getTrainingDataAgreedAt()
        );
    }

    private UserConsent findOrCreateConsent(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return userConsentRepository.findByUser(user)
                .orElseGet(() -> userConsentRepository.save(UserConsent.createDefault(user)));
    }
}
