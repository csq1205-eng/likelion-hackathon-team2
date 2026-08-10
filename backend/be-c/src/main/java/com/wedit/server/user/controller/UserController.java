package com.wedit.server.user.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.user.dto.ConsentRequest;
import com.wedit.server.user.dto.ConsentResponse;
import com.wedit.server.user.dto.OnboardingRequest;
import com.wedit.server.user.dto.OnboardingResponse;
import com.wedit.server.user.dto.TrainingDataConsentRequest;
import com.wedit.server.user.dto.TrainingDataConsentResponse;
import com.wedit.server.user.service.UserConsentService;
import com.wedit.server.user.service.UserOnboardingService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserConsentService userConsentService;
    private final UserOnboardingService userOnboardingService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public UserController(
            UserConsentService userConsentService,
            UserOnboardingService userOnboardingService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.userConsentService = userConsentService;
        this.userOnboardingService = userOnboardingService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @PostMapping("/{userId}/consent")
    public ApiResponse<ConsentResponse> updatePrivacyConsent(
            @PathVariable Long userId,
            @Valid @RequestBody ConsentRequest request
    ) {
        return ApiResponse.success(userConsentService.updatePrivacyConsent(userId, request));
    }

    @PatchMapping("/{userId}/consent/training-data")
    public ApiResponse<TrainingDataConsentResponse> updateTrainingDataConsent(
            @PathVariable Long userId,
            @Valid @RequestBody TrainingDataConsentRequest request
    ) {
        return ApiResponse.success(userConsentService.updateTrainingDataConsent(userId, request));
    }

    @PostMapping("/onboarding")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<OnboardingResponse> saveOnboarding(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody OnboardingRequest request
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(userOnboardingService.saveOnboarding(userId, request));
    }
}
