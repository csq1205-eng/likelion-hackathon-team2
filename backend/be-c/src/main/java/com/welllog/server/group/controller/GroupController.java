package com.welllog.server.group.controller;

import com.welllog.server.auth.service.TemporaryAccessTokenResolver;
import com.welllog.server.common.ApiResponse;
import com.welllog.server.group.dto.GroupCreateRequest;
import com.welllog.server.group.dto.GroupCreateResponse;
import com.welllog.server.group.dto.GroupInvitePreviewResponse;
import com.welllog.server.group.dto.GroupInviteResponse;
import com.welllog.server.group.dto.GroupJoinRequest;
import com.welllog.server.group.dto.GroupJoinResponse;
import com.welllog.server.group.dto.GroupListResponse;
import com.welllog.server.group.dto.GroupStatusResponse;
import com.welllog.server.group.service.GroupService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final GroupService groupService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public GroupController(
            GroupService groupService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.groupService = groupService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupListResponse> getMyGroups(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.getMyGroups(userId));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupCreateResponse> createGroup(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody GroupCreateRequest request
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.createGroup(userId, request));
    }

    @GetMapping("/{groupId}/invite")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupInviteResponse> getGroupInvite(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long groupId
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.getGroupInvite(userId, groupId));
    }

    @GetMapping("/invite/preview")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupInvitePreviewResponse> previewGroupInvite(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam String inviteCode
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.previewGroupInvite(userId, inviteCode));
    }

    @PostMapping("/join")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupJoinResponse> joinGroup(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody GroupJoinRequest request
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.joinGroup(userId, request));
    }

    @GetMapping("/{groupId}/status")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<GroupStatusResponse> getGroupStatus(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long groupId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(groupService.getGroupStatus(userId, groupId, date));
    }
}
