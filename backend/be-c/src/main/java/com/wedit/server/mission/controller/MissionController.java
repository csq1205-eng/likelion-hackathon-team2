package com.wedit.server.mission.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.mission.dto.GenerateTodayMissionRequest;
import com.wedit.server.mission.dto.MissionGenerationResponse;
import com.wedit.server.mission.dto.MissionResultCreateRequest;
import com.wedit.server.mission.dto.MissionResultCreateResponse;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.service.MissionService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/today/generate")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<List<MissionGenerationResponse>> generateTodayMissions(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody(required = false) GenerateTodayMissionRequest request
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);
        Long groupId = request == null ? null : request.groupId();

        return ApiResponse.success(missionService.generateTodayMissions(userId, groupId));
    }

    @PostMapping("/results")
    public ApiResponse<MissionResultCreateResponse> saveMissionResult(
            @Valid @RequestBody MissionResultCreateRequest request
    ) {
        return ApiResponse.success(missionService.saveMissionResult(request));
    }
}
