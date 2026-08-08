package com.welllog.server.user.service;

import com.welllog.server.common.CustomException;
import com.welllog.server.common.ErrorCode;
import com.welllog.server.user.domain.User;
import com.welllog.server.user.domain.UserConsent;
import com.welllog.server.user.dto.ConsentRequest;
import com.welllog.server.user.dto.ConsentResponse;
import com.welllog.server.user.dto.TrainingDataConsentRequest;
import com.welllog.server.user.dto.TrainingDataConsentResponse;
import com.welllog.server.user.repository.UserConsentRepository;
import com.welllog.server.user.repository.UserRepository;
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
