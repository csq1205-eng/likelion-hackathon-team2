package com.wedit.server.mission.service;

import com.wedit.server.common.ApiResponse;
import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.mission.dto.AiMissionGenerateRequest;
import com.wedit.server.mission.dto.AiMissionGenerateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class MissionGenerationClient {

    private static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final RestClient restClient;
    private final String internalKey;

    public MissionGenerationClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.be-a.base-url:http://localhost:8001}") String baseUrl,
            @Value("${app.ai.internal-key:}") String internalKey
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.internalKey = internalKey;
    }

    public AiMissionGenerateResponse generate(AiMissionGenerateRequest request) {
        try {
            ApiResponse<AiMissionGenerateResponse> response = restClient.post()
                    .uri("/api/ai/missions/generate")
                    .headers(headers -> {
                        if (!internalKey.isBlank()) {
                            headers.set(INTERNAL_KEY_HEADER, internalKey);
                        }
                    })
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (response == null || !response.success() || response.data() == null) {
                throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 미션 생성 응답이 올바르지 않습니다.");
            }

            return response.data();
        } catch (RestClientException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 미션 생성 API 호출에 실패했습니다.");
        }
    }
}
