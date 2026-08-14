package com.wedit.server.mission.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.mission.dto.AiMissionGenerateRequest;
import com.wedit.server.mission.dto.AiMissionGenerateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class MissionGenerationClient {

    private final RestClient restClient;

    public MissionGenerationClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.be-a.base-url:http://localhost:8000}") String baseUrl
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
    }

    public AiMissionGenerateResponse generate(Long userId) {
        try {
            return restClient.post()
                    .uri("/api/ai/missions/generate")
                    .body(new AiMissionGenerateRequest(userId))
                    .retrieve()
                    .body(AiMissionGenerateResponse.class);
        } catch (RestClientException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 미션 생성 API 호출에 실패했습니다.");
        }
    }
}
