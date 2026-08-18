package com.wedit.server.mission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedit.server.mission.dto.AiMissionEnvironmentRequest;
import com.wedit.server.mission.dto.AiMissionGenerateRequest;
import com.wedit.server.mission.dto.AiMissionGenerateResponse;
import com.wedit.server.mission.dto.AiMissionProfileRequest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class MissionGenerationClientTest {

    @Test
    @DisplayName("BE A 미션 생성 호출 시 JSON 요청 본문을 함께 전달한다")
    void generateSendsJsonRequestBody() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        MissionGenerationClient client = new MissionGenerationClient(
                restClientBuilder,
                "http://localhost:8001",
                "internal-secret",
                new ObjectMapper()
        );
        server.expect(once(), requestTo("http://localhost:8001/api/ai/missions/generate"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-Key", "internal-secret"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "userId": 1,
                          "goal": "건강한 생활 습관 만들기",
                          "profile": {
                            "skinType": "normal",
                            "concerns": ["수분 부족"],
                            "sleepHours": 6.5,
                            "habits": [],
                            "painAreas": []
                          },
                          "environment": {
                            "weather": null,
                            "temperature": null,
                            "uvIndex": null,
                            "fineDust": null
                          },
                          "excludedMissions": [],
                          "maxMissions": 3
                        }
                        """))
                .andRespond(withSuccess("""
                        {
                          "success": true,
                          "data": {
                            "userId": 1,
                            "missions": [],
                            "appliedFilters": {},
                            "generationMode": "fallback"
                          },
                          "message": null
                        }
                        """, MediaType.APPLICATION_JSON));

        AiMissionGenerateResponse response = client.generate(new AiMissionGenerateRequest(
                1L,
                "건강한 생활 습관 만들기",
                new AiMissionProfileRequest(
                        "normal",
                        List.of("수분 부족"),
                        6.5,
                        List.of(),
                        List.of()
                ),
                new AiMissionEnvironmentRequest(null, null, null, null),
                List.of(),
                3
        ));

        assertThat(response.userId()).isEqualTo(1L);
        server.verify();
    }
}
