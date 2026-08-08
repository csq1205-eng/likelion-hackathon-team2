package com.welllog.server.user.controller;

import com.welllog.server.auth.service.TemporaryAccessTokenResolver;
import com.welllog.server.common.ApiResponse;
import com.welllog.server.user.dto.ConsentRequest;
import com.welllog.server.user.dto.ConsentResponse;
import com.welllog.server.user.dto.OnboardingRequest;
import com.welllog.server.user.dto.OnboardingResponse;
import com.welllog.server.user.dto.TrainingDataConsentRequest;
import com.welllog.server.user.dto.TrainingDataConsentResponse;
import com.welllog.server.user.service.UserConsentService;
import com.welllog.server.user.service.UserOnboardingService;
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
