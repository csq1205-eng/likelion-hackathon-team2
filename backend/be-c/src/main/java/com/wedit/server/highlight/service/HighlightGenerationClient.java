package com.wedit.server.highlight.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedit.server.common.ApiResponse;
import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.highlight.dto.AiHighlightGenerateRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
public class HighlightGenerationClient {

    private static final String INTERNAL_KEY_HEADER = "X-Internal-Key";

    private final RestClient restClient;
    private final String internalKey;
    private final ObjectMapper objectMapper;

    public HighlightGenerationClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.be-a.base-url:http://localhost:8001}") String baseUrl,
            @Value("${app.ai.internal-key:}") String internalKey,
            ObjectMapper objectMapper
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.internalKey = internalKey;
        this.objectMapper = objectMapper;
    }

    public AiHighlightGenerateResponse generate(AiHighlightGenerateRequest request) {
        try {
            String requestBody = toRequestBody(request);
            ApiResponse<AiHighlightGenerateResponse> response = restClient.post()
                    .uri("/api/ai/highlights/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        if (!internalKey.isBlank()) {
                            headers.set(INTERNAL_KEY_HEADER, internalKey);
                        }
                    })
                    .body(requestBody)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (response == null || !response.success() || response.data() == null) {
                throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 하이라이트 생성 응답이 올바르지 않습니다.");
            }

            return response.data();
        } catch (RestClientResponseException exception) {
            throw new CustomException(
                    ErrorCode.AI_INTEGRATION_FAILED,
                    "BE A 하이라이트 생성 API 호출에 실패했습니다. status="
                            + exception.getStatusCode().value()
                            + ", body="
                            + exception.getResponseBodyAsString()
            );
        } catch (RestClientException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 하이라이트 생성 API 호출에 실패했습니다.");
        }
    }

    private String toRequestBody(AiHighlightGenerateRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 하이라이트 생성 요청 변환에 실패했습니다.");
        }
    }
}
