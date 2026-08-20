package com.wedit.server.highlight.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.highlight.dto.AiHighlightGenerateRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateResponse;
import com.wedit.server.highlight.repository.HighlightRepository;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.dto.MissionResultCreateRequest;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.service.MissionService;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class HighlightGenerationTriggerServiceTest {

    @Autowired
    private MissionService missionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private HighlightRepository highlightRepository;

    @MockitoBean
    private HighlightGenerationClient highlightGenerationClient;

    @Test
    @DisplayName("그룹원의 오늘 그룹 미션이 모두 PASS이면 BE A 하이라이트 생성 후 저장한다")
    void generateHighlightWhenAllGroupMissionsPassed() {
        LocalDate today = LocalDate.now();
        User owner = saveUser("highlight-owner");
        User member = saveUser("highlight-member");
        Group group = groupRepository.save(Group.create(owner, "아침 루틴 그룹", "건강한 생활 습관 만들기", 7));
        groupMemberRepository.save(GroupMember.createOwner(group, owner));
        groupMemberRepository.save(GroupMember.createMember(group, member));
        Mission ownerMission = saveMission(owner, group, today, "아침 물 한 잔 마시기");
        Mission memberMission = saveMission(member, group, today, "선크림 바르기");

        when(highlightGenerationClient.generate(any(AiHighlightGenerateRequest.class)))
                .thenReturn(new AiHighlightGenerateResponse(
                        2026082000010L,
                        group.getId(),
                        "COMPLETED",
                        "http://localhost:8001/generated/highlights/highlight.mp4",
                        12.0,
                        List.of(200L, 201L),
                        List.of(),
                        "COMPLETED"
                ));

        missionService.saveMissionResult(new MissionResultCreateRequest(
                ownerMission.getId(),
                200L,
                "PASS",
                "완료했습니다.",
                null,
                null,
                null,
                null
        ));
        verify(highlightGenerationClient, never()).generate(any(AiHighlightGenerateRequest.class));

        missionService.saveMissionResult(new MissionResultCreateRequest(
                memberMission.getId(),
                201L,
                "PASS",
                "완료했습니다.",
                null,
                null,
                null,
                null
        ));

        ArgumentCaptor<AiHighlightGenerateRequest> requestCaptor = ArgumentCaptor.forClass(AiHighlightGenerateRequest.class);
        verify(highlightGenerationClient).generate(requestCaptor.capture());
        AiHighlightGenerateRequest request = requestCaptor.getValue();
        assertThat(request.groupId()).isEqualTo(group.getId());
        assertThat(request.clips()).extracting("clipId").containsExactly(200L, 201L);

        Highlight highlight = highlightRepository.findFirstByGroupAndHighlightDateOrderByIdDesc(group, today).orElseThrow();
        assertThat(highlight.getVideoUrl()).isEqualTo("http://localhost:8001/generated/highlights/highlight.mp4");
    }

    private User saveUser(String providerUserId) {
        return userRepository.save(User.create(
                SocialProvider.KAKAO,
                providerUserId,
                providerUserId + "@example.com",
                "정효림",
                null
        ));
    }

    private Mission saveMission(User user, Group group, LocalDate missionDate, String title) {
        return missionRepository.save(Mission.create(
                user,
                group,
                missionDate,
                "MORNING",
                title,
                title + "를 수행해 주세요.",
                "HYDRATION",
                "수행 장면이 확인되어야 합니다."
        ));
    }
}
