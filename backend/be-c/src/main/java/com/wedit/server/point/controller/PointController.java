package com.wedit.server.point.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.point.dto.PointRedeemRequest;
import com.wedit.server.point.dto.PointRedeemResponse;
import com.wedit.server.point.service.PointService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/points")
public class PointController {

    private final PointService pointService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public PointController(
            PointService pointService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.pointService = pointService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @PostMapping("/redeem")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<PointRedeemResponse> redeem(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody PointRedeemRequest request
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(pointService.redeem(userId, request));
    }
}
