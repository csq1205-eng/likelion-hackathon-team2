package com.wedit.server.report.controller;

import com.wedit.server.auth.service.TemporaryAccessTokenResolver;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.report.dto.WeeklyReportDataResponse;
import com.wedit.server.report.service.WeeklyReportDataService;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class WeeklyReportDataController {

    private final WeeklyReportDataService weeklyReportDataService;
    private final TemporaryAccessTokenResolver temporaryAccessTokenResolver;

    public WeeklyReportDataController(
            WeeklyReportDataService weeklyReportDataService,
            TemporaryAccessTokenResolver temporaryAccessTokenResolver
    ) {
        this.weeklyReportDataService = weeklyReportDataService;
        this.temporaryAccessTokenResolver = temporaryAccessTokenResolver;
    }

    @GetMapping("/me/weekly-report-data")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<WeeklyReportDataResponse> getMyWeeklyReportData(
            @Parameter(hidden = true)
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate
    ) {
        Long userId = temporaryAccessTokenResolver.resolveUserId(authorizationHeader);

        return ApiResponse.success(weeklyReportDataService.getWeeklyReportData(userId, weekStartDate));
    }
}
