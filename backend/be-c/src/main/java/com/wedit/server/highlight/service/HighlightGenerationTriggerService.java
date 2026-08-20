package com.wedit.server.highlight.service;

import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.highlight.dto.AiHighlightClipRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateRequest;
import com.wedit.server.highlight.dto.AiHighlightGenerateResponse;
import com.wedit.server.highlight.dto.HighlightMissionClipRow;
import com.wedit.server.highlight.dto.HighlightSaveRequest;
import com.wedit.server.highlight.repository.HighlightRepository;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.domain.MissionStatus;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.repository.MissionResultRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HighlightGenerationTriggerService {

    private static final Logger log = LoggerFactory.getLogger(HighlightGenerationTriggerService.class);
    private static final DateTimeFormatter HIGHLIGHT_ID_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final int MAX_HIGHLIGHT_CLIP_COUNT = 6;
    private static final int MAX_DURATION_SECONDS = 30;

    private final MissionRepository missionRepository;
    private final MissionResultRepository missionResultRepository;
    private final HighlightRepository highlightRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final HighlightGenerationClient highlightGenerationClient;
    private final HighlightService highlightService;

    public HighlightGenerationTriggerService(
            MissionRepository missionRepository,
            MissionResultRepository missionResultRepository,
            HighlightRepository highlightRepository,
            GroupMemberRepository groupMemberRepository,
            HighlightGenerationClient highlightGenerationClient,
            HighlightService highlightService
    ) {
        this.missionRepository = missionRepository;
        this.missionResultRepository = missionResultRepository;
        this.highlightRepository = highlightRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.highlightGenerationClient = highlightGenerationClient;
        this.highlightService = highlightService;
    }

    public void generateIfGroupMissionCompleted(Mission mission) {
        Group group = mission.getGroup();
        if (group == null) {
            return;
        }

        LocalDate missionDate = mission.getMissionDate();
        if (highlightRepository.findFirstByGroupAndHighlightDateOrderByIdDesc(group, missionDate).isPresent()) {
            return;
        }

        List<Mission> groupMissions = missionRepository.findAllByGroupAndMissionDateOrderByIdAsc(group, missionDate);
        if (!isEveryActiveMemberMissionPassed(group, groupMissions)) {
            return;
        }

        List<AiHighlightClipRequest> clips = toHighlightClips(group, missionDate);
        if (clips.isEmpty()) {
            return;
        }

        try {
            String title = "오늘의 W 하이라이트";
            AiHighlightGenerateResponse response = highlightGenerationClient.generate(new AiHighlightGenerateRequest(
                    generateHighlightRequestId(group.getId(), missionDate),
                    group.getId(),
                    title,
                    clips,
                    MAX_DURATION_SECONDS
            ));

            highlightService.saveHighlight(new HighlightSaveRequest(
                    null,
                    group.getId(),
                    missionDate,
                    title,
                    "오늘 그룹 미션을 모두 완료했습니다.",
                    response.videoUrl()
            ));
        } catch (RuntimeException exception) {
            log.warn(
                    "그룹 하이라이트 생성 트리거 처리에 실패했습니다. groupId={}, missionDate={}",
                    group.getId(),
                    missionDate,
                    exception
            );
        }
    }

    private boolean isEveryActiveMemberMissionPassed(Group group, List<Mission> groupMissions) {
        if (groupMissions.isEmpty()
                || groupMissions.stream().anyMatch(groupMission -> groupMission.getStatus() != MissionStatus.PASSED)) {
            return false;
        }

        Set<Long> activeMemberIds = groupMemberRepository.findAllByGroupAndStatus(group, GroupMemberStatus.ACTIVE)
                .stream()
                .map(GroupMember::getUser)
                .map(user -> user.getId())
                .collect(Collectors.toSet());
        if (activeMemberIds.isEmpty()) {
            return false;
        }

        Set<Long> missionOwnerIds = groupMissions.stream()
                .map(Mission::getUser)
                .map(user -> user.getId())
                .collect(Collectors.toSet());

        return missionOwnerIds.containsAll(activeMemberIds);
    }

    private List<AiHighlightClipRequest> toHighlightClips(Group group, LocalDate missionDate) {
        Map<Long, HighlightMissionClipRow> clipRowsByMissionId = new LinkedHashMap<>();
        for (HighlightMissionClipRow row : missionResultRepository.findHighlightMissionClipRows(
                group,
                missionDate,
                MissionResultType.PASS
        )) {
            clipRowsByMissionId.putIfAbsent(row.missionId(), row);
        }

        return clipRowsByMissionId.values()
                .stream()
                .limit(MAX_HIGHLIGHT_CLIP_COUNT)
                .map(row -> new AiHighlightClipRequest(
                        row.clipId(),
                        false,
                        null,
                        row.missionTitle() + " 완료"
                ))
                .toList();
    }

    private Long generateHighlightRequestId(Long groupId, LocalDate missionDate) {
        long dateValue = Long.parseLong(missionDate.format(HIGHLIGHT_ID_DATE_FORMATTER));
        return dateValue * 100_000L + groupId % 100_000L;
    }
}
