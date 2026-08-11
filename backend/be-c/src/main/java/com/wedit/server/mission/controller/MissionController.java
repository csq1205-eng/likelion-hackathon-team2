package com.wedit.server.mission.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.service.MissionService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {

    private final MissionService missionService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public MissionController(
            MissionService missionService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.missionService = missionService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @GetMapping("/today")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<TodayMissionResponse> getTodayMissions(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(missionService.getTodayMissions(userId));
    }
}
