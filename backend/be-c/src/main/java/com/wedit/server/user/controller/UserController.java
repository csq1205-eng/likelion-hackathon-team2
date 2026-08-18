package com.wedit.server.user.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.highlight.dto.HighlightListResponse;
import com.wedit.server.highlight.service.HighlightService;
import com.wedit.server.notification.dto.NotificationListResponse;
import com.wedit.server.notification.dto.NotificationCreateRequest;
import com.wedit.server.notification.dto.NotificationCreateResponse;
import com.wedit.server.notification.dto.PushTokenRequest;
import com.wedit.server.notification.dto.PushTokenResponse;
import com.wedit.server.notification.service.NotificationService;
import com.wedit.server.point.dto.PointResponse;
import com.wedit.server.point.service.PointService;
import com.wedit.server.product.domain.ProductRecommendationType;
import com.wedit.server.product.dto.ProductRecommendationCreateResponse;
import com.wedit.server.product.dto.ProductRecommendationListResponse;
import com.wedit.server.product.service.ProductRecommendationService;
import com.wedit.server.reward.dto.RewardGrantListResponse;
import com.wedit.server.reward.service.RewardService;
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
    private final ProductRecommendationService productRecommendationService;
    private final RewardService rewardService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public UserController(
            UserConsentService userConsentService,
            UserOnboardingService userOnboardingService,
            UserWithdrawalService userWithdrawalService,
            UserRecordService userRecordService,
            PointService pointService,
            HighlightService highlightService,
            NotificationService notificationService,
            ProductRecommendationService productRecommendationService,
            RewardService rewardService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.userConsentService = userConsentService;
        this.userOnboardingService = userOnboardingService;
        this.userWithdrawalService = userWithdrawalService;
        this.userRecordService = userRecordService;
        this.pointService = pointService;
        this.highlightService = highlightService;
        this.notificationService = notificationService;
        this.productRecommendationService = productRecommendationService;
        this.rewardService = rewardService;
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
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<UserStreakResponse> getStreak(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(userRecordService.getStreak(userId));
    }

    @GetMapping("/{userId}/missions/history")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<MissionHistoryResponse> getMissionHistory(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(userRecordService.getMissionHistory(userId, year, month));
    }

    @GetMapping("/{userId}/points")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<PointResponse> getPoints(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(pointService.getPoints(userId));
    }

    @GetMapping("/{userId}/reward-grants")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<RewardGrantListResponse> getRewardGrants(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(rewardService.getRewardGrants(userId));
    }

    @GetMapping("/{userId}/product-recommendations")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<ProductRecommendationListResponse> getProductRecommendations(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @RequestParam(required = false) ProductRecommendationType type
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(productRecommendationService.getRecommendations(userId, type));
    }

    @PostMapping("/{userId}/product-recommendations/missing-products")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<ProductRecommendationCreateResponse> createMissingProductRecommendations(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(productRecommendationService.createMissingProductRecommendations(userId));
    }

    @PostMapping("/{userId}/groups/{groupId}/product-recommendations/commerce")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<ProductRecommendationCreateResponse> createCommerceRecommendations(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @PathVariable Long groupId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(productRecommendationService.createCommerceRecommendations(userId, groupId));
    }

    @GetMapping("/{userId}/highlights")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<HighlightListResponse> getHighlights(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(highlightService.getHighlights(userId));
    }

    @PostMapping("/{userId}/push-token")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<PushTokenResponse> registerPushToken(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @Valid @RequestBody PushTokenRequest request
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(notificationService.registerPushToken(userId, request));
    }

    @GetMapping("/{userId}/notifications")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<NotificationListResponse> getNotifications(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(notificationService.getNotifications(userId));
    }

    @PostMapping("/{userId}/notifications")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<NotificationCreateResponse> createNotification(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long userId,
            @Valid @RequestBody NotificationCreateRequest request
    ) {
        validateRequester(authorizationHeader, userId);

        return ApiResponse.success(notificationService.createNotification(userId, request));
    }

    private void validateRequester(String authorizationHeader, Long userId) {
        Long requesterId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);
        if (!requesterId.equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
