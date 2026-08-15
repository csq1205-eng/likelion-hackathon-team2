package com.wedit.server.user.service;

import com.wedit.server.common.ApiResponse;
import com.wedit.server.user.dto.WithdrawalCleanupRequest;
import com.wedit.server.user.dto.WithdrawalCleanupResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class WithdrawalCleanupClient {

    private static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final RestClient restClient;
    private final String internalKey;

    public WithdrawalCleanupClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.be-b.base-url:http://localhost:8002}") String baseUrl,
            @Value("${app.ai.internal-key:}") String internalKey
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.internalKey = internalKey;
    }

    public WithdrawalCleanupResponse cleanup(WithdrawalCleanupRequest request) {
        try {
            ApiResponse<WithdrawalCleanupResponse> response = restClient.post()
                    .uri("/api/ai/clips/withdrawal-cleanup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        if (!internalKey.isBlank()) {
                            headers.set(INTERNAL_KEY_HEADER, internalKey);
                        }
                    })
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (response == null || response.data() == null) {
                return failedResponse(request);
            }

            return response.data();
        } catch (RestClientException exception) {
            return failedResponse(request);
        }
    }

    private WithdrawalCleanupResponse failedResponse(WithdrawalCleanupRequest request) {
        return new WithdrawalCleanupResponse(
                request.userId(),
                request.withdrawalId(),
                0,
                0,
                "FAILED",
                false
        );
    }
}
