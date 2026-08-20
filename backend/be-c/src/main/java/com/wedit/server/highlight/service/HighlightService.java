package com.wedit.server.highlight.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.highlight.domain.HighlightType;
import com.wedit.server.highlight.dto.HighlightItemResponse;
import com.wedit.server.highlight.dto.HighlightListResponse;
import com.wedit.server.highlight.dto.HighlightMemberMissionRow;
import com.wedit.server.highlight.dto.HighlightMemberResponse;
import com.wedit.server.highlight.dto.HighlightSaveRequest;
import com.wedit.server.highlight.repository.HighlightRepository;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HighlightService {

    private static final DateTimeFormatter MEMBER_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final HighlightRepository highlightRepository;
    private final MissionResultRepository missionResultRepository;

    public HighlightService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            HighlightRepository highlightRepository,
            MissionResultRepository missionResultRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.highlightRepository = highlightRepository;
        this.missionResultRepository = missionResultRepository;
    }

    @Transactional(readOnly = true)
    public HighlightListResponse getHighlights(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return new HighlightListResponse(highlightRepository.findAllByUserOrderByHighlightDateDescIdDesc(user)
                .stream()
                .map(this::toHighlightItemResponse)
                .toList());
    }

    @Transactional(readOnly = true)
    public HighlightItemResponse getGroupHighlight(Long requesterId, Long groupId, LocalDate highlightDate) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
        if (!groupMemberRepository.existsByGroupAndUserAndStatus(group, requester, GroupMemberStatus.ACTIVE)) {
            throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
        }

        LocalDate targetDate = highlightDate == null ? LocalDate.now() : highlightDate;
        Highlight highlight = highlightRepository.findFirstByGroupAndHighlightDateOrderByIdDesc(group, targetDate)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "하이라이트를 찾을 수 없습니다."));

        return toHighlightItemResponse(highlight);
    }

    @Transactional
    public HighlightItemResponse saveHighlight(HighlightSaveRequest request) {
        User user = findUser(request.userId());
        Group group = findGroup(request.groupId());
        if (user == null && group == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "사용자 ID 또는 그룹 ID 중 하나는 필수입니다.");
        }
        HighlightType highlightType = group == null ? HighlightType.USER : HighlightType.GROUP;

        Highlight highlight = findExistingHighlight(user, group, request.highlightDate())
                .map(existingHighlight -> {
                    existingHighlight.update(highlightType, request.title(), request.summary(), request.videoUrl());
                    return existingHighlight;
                })
                .orElseGet(() -> highlightRepository.save(Highlight.create(
                        user,
                        group,
                        highlightType,
                        request.highlightDate(),
                        request.title(),
                        request.summary(),
                        request.videoUrl()
                )));

        return toHighlightItemResponse(highlight);
    }

    private Optional<Highlight> findExistingHighlight(User user, Group group, LocalDate highlightDate) {
        if (user != null && group != null) {
            return highlightRepository.findFirstByUserAndGroupAndHighlightDateOrderByIdDesc(user, group, highlightDate);
        }
        if (group != null) {
            return highlightRepository.findFirstByGroupAndHighlightDateOrderByIdDesc(group, highlightDate);
        }

        return highlightRepository.findFirstByUserAndHighlightDateOrderByIdDesc(user, highlightDate);
    }

    private User findUser(Long userId) {
        if (userId == null) {
            return null;
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private Group findGroup(Long groupId) {
        if (groupId == null) {
            return null;
        }

        return groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
    }

    private HighlightItemResponse toHighlightItemResponse(Highlight highlight) {
        return new HighlightItemResponse(
                highlight.getGroup() == null ? null : highlight.getGroup().getId(),
                highlight.getId(),
                highlight.getHighlightDate(),
                highlight.getTitle(),
                highlight.getSummary(),
                highlight.getVideoUrl(),
                toHighlightMembers(highlight)
        );
    }

    private List<HighlightMemberResponse> toHighlightMembers(Highlight highlight) {
        Group group = highlight.getGroup();
        if (group == null) {
            return List.of();
        }

        Map<Long, MemberHighlightCard> cardsByUserId = new LinkedHashMap<>();
        for (GroupMember groupMember : groupMemberRepository.findAllByGroupAndStatus(group, GroupMemberStatus.ACTIVE)) {
            User user = groupMember.getUser();
            cardsByUserId.put(user.getId(), new MemberHighlightCard(displayName(user)));
        }

        for (HighlightMemberMissionRow row : missionResultRepository.findHighlightMemberMissionRows(
                group,
                highlight.getHighlightDate(),
                MissionResultType.PASS
        )) {
            cardsByUserId.computeIfAbsent(row.userId(), userId -> new MemberHighlightCard(row.nickname()))
                    .addMission(row.missionTitle(), row.judgedAt() == null ? null : row.judgedAt().format(MEMBER_TIME_FORMATTER));
        }

        return cardsByUserId.entrySet()
                .stream()
                .map(entry -> toHighlightMemberResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private HighlightMemberResponse toHighlightMemberResponse(Long userId, MemberHighlightCard card) {
        return new HighlightMemberResponse(
                userId,
                card.name(),
                "card",
                "CARD",
                card.content(),
                null,
                card.time(),
                card.completed()
        );
    }

    private String displayName(User user) {
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname();
        }

        return "사용자 " + user.getId();
    }

    private static class MemberHighlightCard {

        private final String name;
        private final List<String> missionTitles = new ArrayList<>();
        private String completedTime;

        private MemberHighlightCard(String name) {
            this.name = name;
        }

        private void addMission(String missionTitle, String completedTime) {
            if (missionTitle != null && !missionTitle.isBlank()) {
                missionTitles.add(missionTitle);
            }
            if (completedTime != null) {
                this.completedTime = completedTime;
            }
        }

        private String name() {
            return name;
        }

        private String content() {
            if (missionTitles.isEmpty()) {
                return "미션 완료 대기";
            }

            return String.join(", ", missionTitles);
        }

        private String time() {
            if (completedTime == null) {
                return "미완료";
            }

            return completedTime + " 완료";
        }

        private boolean completed() {
            return !missionTitles.isEmpty();
        }
    }
}
