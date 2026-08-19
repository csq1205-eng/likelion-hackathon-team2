package com.wedit.server.highlight.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.common.InternalApiKeyValidator;
import com.wedit.server.highlight.dto.HighlightItemResponse;
import com.wedit.server.highlight.dto.HighlightSaveRequest;
import com.wedit.server.highlight.service.HighlightService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HighlightController {

    private final HighlightService highlightService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public HighlightController(
            HighlightService highlightService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver,
            InternalApiKeyValidator internalApiKeyValidator
    ) {
        this.highlightService = highlightService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/groups/{groupId}/highlight")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<HighlightItemResponse> getGroupHighlight(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long groupId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(highlightService.getGroupHighlight(userId, groupId, date));
    }

    @PostMapping("/internal/highlights")
    public ApiResponse<HighlightItemResponse> saveHighlight(
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey,
            @Valid @RequestBody HighlightSaveRequest request
    ) {
        internalApiKeyValidator.validate(internalKey);

        return ApiResponse.success(highlightService.saveHighlight(request));
    }
}
