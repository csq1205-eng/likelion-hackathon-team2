package com.wedit.server.highlight.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.highlight.dto.HighlightItemResponse;
import com.wedit.server.highlight.dto.HighlightListResponse;
import com.wedit.server.highlight.dto.HighlightSaveRequest;
import com.wedit.server.highlight.repository.HighlightRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HighlightService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final HighlightRepository highlightRepository;

    public HighlightService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            HighlightRepository highlightRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.highlightRepository = highlightRepository;
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

        Highlight highlight = findExistingHighlight(user, group, request.highlightDate())
                .map(existingHighlight -> {
                    existingHighlight.update(request.title(), request.summary(), request.videoUrl());
                    return existingHighlight;
                })
                .orElseGet(() -> highlightRepository.save(Highlight.create(
                        user,
                        group,
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
                highlight.getId(),
                highlight.getHighlightDate(),
                highlight.getTitle(),
                highlight.getSummary(),
                highlight.getVideoUrl()
        );
    }
}
