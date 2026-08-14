package com.wedit.server.user.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.user.dto.WithdrawalCleanupRequest;
import com.wedit.server.user.dto.WithdrawalCleanupResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WithdrawalCleanupClient {

    private final RestClient restClient;

    public WithdrawalCleanupClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.be-b.base-url:http://localhost:8001}") String baseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    public WithdrawalCleanupResponse cleanup(WithdrawalCleanupRequest request) {
        try {
            return restClient.post()
                    .uri("/api/ai/clips/withdrawal-cleanup")
                    .body(request)
                    .retrieve()
                    .body(WithdrawalCleanupResponse.class);
        } catch (RestClientException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE B 탈퇴 클립 정리 API 호출에 실패했습니다.");
        }
    }
}
