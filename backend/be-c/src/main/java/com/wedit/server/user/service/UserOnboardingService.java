package com.wedit.server.user.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserMissionPreference;
import com.wedit.server.user.domain.UserOnboardingProfile;
import com.wedit.server.user.domain.UserOwnedProduct;
import com.wedit.server.user.dto.OnboardingRequest;
import com.wedit.server.user.dto.OnboardingResponse;
import com.wedit.server.user.repository.UserMissionPreferenceRepository;
import com.wedit.server.user.repository.UserOnboardingProfileRepository;
import com.wedit.server.user.repository.UserOwnedProductRepository;
import com.wedit.server.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserOnboardingService {

    private final UserRepository userRepository;
    private final UserOnboardingProfileRepository userOnboardingProfileRepository;
    private final UserMissionPreferenceRepository userMissionPreferenceRepository;
    private final UserOwnedProductRepository userOwnedProductRepository;

    public UserOnboardingService(
            UserRepository userRepository,
            UserOnboardingProfileRepository userOnboardingProfileRepository,
            UserMissionPreferenceRepository userMissionPreferenceRepository,
            UserOwnedProductRepository userOwnedProductRepository
    ) {
        this.userRepository = userRepository;
        this.userOnboardingProfileRepository = userOnboardingProfileRepository;
        this.userMissionPreferenceRepository = userMissionPreferenceRepository;
        this.userOwnedProductRepository = userOwnedProductRepository;
    }

    @Transactional
    public OnboardingResponse saveOnboarding(Long userId, OnboardingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        saveProfile(user, request);
        saveMissionPreference(user, request);
        replaceOwnedProducts(user, request);
        user.completeOnboarding();

        return new OnboardingResponse(user.getId(), user.isOnboardingCompleted());
    }

    private void saveProfile(User user, OnboardingRequest request) {
        userOnboardingProfileRepository.findByUser(user)
                .ifPresentOrElse(
                        profile -> profile.update(
                                request.mainConcern(),
                                nullToEmpty(request.causeCandidates()),
                                request.sleepHours(),
                                request.waterIntake(),
                                request.wakeUpTime(),
                                request.sleepTime()
                        ),
                        () -> userOnboardingProfileRepository.save(UserOnboardingProfile.create(
                                user,
                                request.mainConcern(),
                                nullToEmpty(request.causeCandidates()),
                                request.sleepHours(),
                                request.waterIntake(),
                                request.wakeUpTime(),
                                request.sleepTime()
                        ))
                );
    }

    private void saveMissionPreference(User user, OnboardingRequest request) {
        userMissionPreferenceRepository.findByUser(user)
                .ifPresentOrElse(
                        preference -> preference.update(
                                nullToEmpty(request.preferredMissionTypes()),
                                nullToEmpty(request.avoidedMissionTypes()),
                                List.of()
                        ),
                        () -> userMissionPreferenceRepository.save(UserMissionPreference.create(
                                user,
                                nullToEmpty(request.preferredMissionTypes()),
                                nullToEmpty(request.avoidedMissionTypes()),
                                List.of()
                        ))
                );
    }

    private void replaceOwnedProducts(User user, OnboardingRequest request) {
        userOwnedProductRepository.deleteByUser(user);

        List<UserOwnedProduct> ownedProducts = request.ownedProducts()
                .stream()
                .map(ownedProduct -> UserOwnedProduct.create(
                        user,
                        ownedProduct.category(),
                        ownedProduct.hasProduct()
                ))
                .toList();

        userOwnedProductRepository.saveAll(ownedProducts);
    }

    private List<String> nullToEmpty(List<String> values) {
        return values == null ? List.of() : values;
    }
}
