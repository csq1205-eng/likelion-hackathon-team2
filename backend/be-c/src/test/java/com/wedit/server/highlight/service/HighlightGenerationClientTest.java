package com.wedit.server.highlight.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedit.server.highlight.dto.AiHighlightClipRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateResponse;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class HighlightGenerationClientTest {

    @Test
    @DisplayName("BE A 하이라이트 생성 호출 시 JSON 요청 본문을 함께 전달한다")
    void generateSendsJsonRequestBody() {
        RestClient.Builder restClientBuilder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restClientBuilder).build();
        HighlightGenerationClient client = new HighlightGenerationClient(
                restClientBuilder,
                "http://localhost:8001",
                "internal-secret",
                new ObjectMapper()
        );
        server.expect(once(), requestTo("http://localhost:8001/api/ai/highlights/generate"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Internal-Key", "internal-secret"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "highlightId": 2026082000010,
                          "groupId": 10,
                          "title": "오늘의 W 하이라이트",
                          "clips": [
                            {
                              "clipId": 200,
                              "shared": false,
                              "sourceUrl": null,
                              "caption": "아침 물 한 잔 마시기 완료"
                            }
                          ],
                          "maxDurationSeconds": 30
                        }
                        """))
                .andRespond(withSuccess("""
                        {
                          "success": true,
                          "data": {
                            "highlightId": 2026082000010,
                            "groupId": 10,
                            "status": "COMPLETED",
                            "videoUrl": "http://localhost:8001/generated/highlights/highlight-2026082000010.mp4",
                            "durationSeconds": 7.0,
                            "notifiedClipIds": [200],
                            "failedClipIds": [],
                            "callbackStatus": "COMPLETED"
                          },
                          "message": null
                        }
                        """, MediaType.APPLICATION_JSON));

        AiHighlightGenerateResponse response = client.generate(new AiHighlightGenerateRequest(
                2026082000010L,
                10L,
                "오늘의 W 하이라이트",
                List.of(new AiHighlightClipRequest(
                        200L,
                        false,
                        null,
                        "아침 물 한 잔 마시기 완료"
                )),
                30
        ));

        assertThat(response.videoUrl()).isEqualTo("http://localhost:8001/generated/highlights/highlight-2026082000010.mp4");
        server.verify();
    }
}
