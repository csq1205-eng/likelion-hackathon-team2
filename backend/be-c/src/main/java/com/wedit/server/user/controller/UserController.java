package com.wedit.server.user.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.highlight.dto.HighlightListResponse;
import com.wedit.server.highlight.service.HighlightService;
import com.wedit.server.notification.dto.NotificationListResponse;
import com.wedit.server.notification.dto.PushTokenRequest;
import com.wedit.server.notification.dto.PushTokenResponse;
import com.wedit.server.notification.service.NotificationService;
import com.wedit.server.point.dto.PointResponse;
import com.wedit.server.point.service.PointService;
import com.wedit.server.user.dto.ConsentRequest;
import com.wedit.server.user.dto.ConsentResponse;
import com.wedit.server.user.dto.MissionHistoryResponse;
import com.wedit.server.user.dto.OnboardingRequest;
import com.wedit.server.user.dto.OnboardingResponse;
import com.wedit.server.user.dto.TrainingDataConsentRequest;
import com.wedit.server.user.dto.TrainingDataConsentResponse;
import com.wedit.server.user.dto.UserStreakResponse;
import com.wedit.server.user.dto.UserWithdrawalRequest;
import com.wedit.server.user.dto.UserWithdrawalResponse;
import com.wedit.server.user.service.UserConsentService;
import com.wedit.server.user.service.UserOnboardingService;
import com.wedit.server.user.service.UserRecordService;
import com.wedit.server.user.service.UserWithdrawalService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserConsentService userConsentService;
    private final UserOnboardingService userOnboardingService;
    private final UserWithdrawalService userWithdrawalService;
    private final UserRecordService userRecordService;
    private final PointService pointService;
    private final HighlightService highlightService;
    private final NotificationService notificationService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public UserController(
            UserConsentService userConsentService,
            UserOnboardingService userOnboardingService,
            UserWithdrawalService userWithdrawalService,
            UserRecordService userRecordService,
            PointService pointService,
            HighlightService highlightService,
            NotificationService notificationService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.userConsentService = userConsentService;
        this.userOnboardingService = userOnboardingService;
        this.userWithdrawalService = userWithdrawalService;
        this.userRecordService = userRecordService;
        this.pointService = pointService;
        this.highlightService = highlightService;
        this.notificationService = notificationService;
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

    @DeleteMapping("/{userId}")
    public ApiResponse<UserWithdrawalResponse> withdraw(
            @PathVariable Long userId,
            @RequestBody(required = false) UserWithdrawalRequest request
    ) {
        UserWithdrawalRequest withdrawalRequest = request == null ? new UserWithdrawalRequest(null) : request;

        return ApiResponse.success(userWithdrawalService.withdraw(userId, withdrawalRequest));
    }

    @GetMapping("/{userId}/streak")
    public ApiResponse<UserStreakResponse> getStreak(@PathVariable Long userId) {
        return ApiResponse.success(userRecordService.getStreak(userId));
    }

    @GetMapping("/{userId}/missions/history")
    public ApiResponse<MissionHistoryResponse> getMissionHistory(
            @PathVariable Long userId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.success(userRecordService.getMissionHistory(userId, year, month));
    }

    @GetMapping("/{userId}/points")
    public ApiResponse<PointResponse> getPoints(@PathVariable Long userId) {
        return ApiResponse.success(pointService.getPoints(userId));
    }

    @GetMapping("/{userId}/highlights")
    public ApiResponse<HighlightListResponse> getHighlights(@PathVariable Long userId) {
        return ApiResponse.success(highlightService.getHighlights(userId));
    }

    @PostMapping("/{userId}/push-token")
    public ApiResponse<PushTokenResponse> registerPushToken(
            @PathVariable Long userId,
            @Valid @RequestBody PushTokenRequest request
    ) {
        return ApiResponse.success(notificationService.registerPushToken(userId, request));
    }

    @GetMapping("/{userId}/notifications")
    public ApiResponse<NotificationListResponse> getNotifications(@PathVariable Long userId) {
        return ApiResponse.success(notificationService.getNotifications(userId));
    }
}
