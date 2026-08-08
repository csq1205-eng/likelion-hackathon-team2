package com.welllog.server.group.service;

import com.welllog.server.common.CustomException;
import com.welllog.server.common.ErrorCode;
import com.welllog.server.group.domain.Group;
import com.welllog.server.group.domain.GroupInvite;
import com.welllog.server.group.domain.GroupMember;
import com.welllog.server.group.domain.GroupMemberStatus;
import com.welllog.server.group.dto.GroupCreateRequest;
import com.welllog.server.group.dto.GroupCreateResponse;
import com.welllog.server.group.dto.GroupInvitePreviewResponse;
import com.welllog.server.group.dto.GroupInviteResponse;
import com.welllog.server.group.dto.GroupJoinRequest;
import com.welllog.server.group.dto.GroupJoinResponse;
import com.welllog.server.group.dto.GroupListResponse;
import com.welllog.server.group.dto.GroupMemberStatusResponse;
import com.welllog.server.group.dto.GroupPreviewMemberResponse;
import com.welllog.server.group.dto.GroupStatusResponse;
import com.welllog.server.group.dto.GroupSummaryResponse;
import com.welllog.server.group.repository.GroupInviteRepository;
import com.welllog.server.group.repository.GroupMemberRepository;
import com.welllog.server.group.repository.GroupRepository;
import com.welllog.server.user.domain.User;
import com.welllog.server.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupService {

    private static final String INVITE_URL_PREFIX = "https://welllog.app/groups/join?code=";
    private static final int INVITE_CODE_BOUND = 1_000_000;
    private static final int MAX_INVITE_CODE_RETRY_COUNT = 10;

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupInviteRepository groupInviteRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public GroupService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            GroupInviteRepository groupInviteRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupInviteRepository = groupInviteRepository;
    }

    @Transactional(readOnly = true)
    public GroupListResponse getMyGroups(Long userId) {
        User user = findUser(userId);

        List<GroupSummaryResponse> groups = groupMemberRepository
                .findAllByUserAndStatus(user, GroupMemberStatus.ACTIVE)
                .stream()
                .map(GroupMember::getGroup)
                .map(this::toGroupSummaryResponse)
                .toList();

        return new GroupListResponse(groups);
    }

    @Transactional
    public GroupCreateResponse createGroup(Long userId, GroupCreateRequest request) {
        User owner = findUser(userId);

        Group group = groupRepository.save(Group.create(
                owner,
                request.name(),
                request.goalName(),
                request.targetDays()
        ));
        groupMemberRepository.save(GroupMember.createOwner(group, owner));

        String inviteCode = createUniqueInviteCode();
        groupInviteRepository.save(GroupInvite.create(
                group,
                inviteCode,
                INVITE_URL_PREFIX + inviteCode
        ));

        return new GroupCreateResponse(
                group.getId(),
                group.getName(),
                group.getGoalName(),
                group.getTargetDays(),
                inviteCode
        );
    }

    @Transactional(readOnly = true)
    public GroupInviteResponse getGroupInvite(Long userId, Long groupId) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        GroupInvite invite = findInviteByGroup(group);

        return new GroupInviteResponse(
                group.getId(),
                invite.getInviteCode(),
                invite.getInviteUrl(),
                invite.getQrImageUrl(),
                invite.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public GroupInvitePreviewResponse previewGroupInvite(Long userId, String inviteCode) {
        User user = findUser(userId);
        GroupInvite invite = findInviteByCode(inviteCode);
        Group group = invite.getGroup();
        List<GroupMember> activeMembers = groupMemberRepository.findAllByGroupAndStatus(
                group,
                GroupMemberStatus.ACTIVE
        );
        boolean joinable = activeMembers.stream()
                .noneMatch(member -> member.getUser().getId().equals(user.getId()));

        return new GroupInvitePreviewResponse(
                group.getId(),
                group.getName(),
                group.getGoalName(),
                activeMembers.size(),
                activeMembers.stream()
                        .map(member -> new GroupPreviewMemberResponse(
                                member.getUser().getId(),
                                member.getUser().getNickname()
                        ))
                        .toList(),
                joinable
        );
    }

    @Transactional
    public GroupJoinResponse joinGroup(Long userId, GroupJoinRequest request) {
        User user = findUser(userId);
        GroupInvite invite = findInviteByCode(request.inviteCode());
        Group group = invite.getGroup();

        GroupMember groupMember = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseGet(() -> groupMemberRepository.save(GroupMember.createMember(group, user)));

        return new GroupJoinResponse(
                group.getId(),
                user.getId(),
                groupMember.getRole().name(),
                groupMember.getJoinedAt()
        );
    }

    @Transactional(readOnly = true)
    public GroupStatusResponse getGroupStatus(Long userId, Long groupId, LocalDate date) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        LocalDate responseDate = date == null ? LocalDate.now() : date;
        List<GroupMember> activeMembers = groupMemberRepository.findAllByGroupAndStatus(
                group,
                GroupMemberStatus.ACTIVE
        );
        List<GroupMemberStatusResponse> members = activeMembers.stream()
                .map(member -> new GroupMemberStatusResponse(
                        member.getUser().getId(),
                        member.getUser().getNickname(),
                        0,
                        3,
                        false
                ))
                .toList();

        return new GroupStatusResponse(
                group.getId(),
                responseDate,
                activeMembers.size(),
                0,
                0.0,
                false,
                members
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
    }

    private GroupInvite findInviteByGroup(Group group) {
        return groupInviteRepository.findByGroup(group)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_GROUP_INVITE_CODE));
    }

    private GroupInvite findInviteByCode(String inviteCode) {
        return groupInviteRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_GROUP_INVITE_CODE));
    }

    private void validateActiveMember(Group group, User user) {
        if (!groupMemberRepository.existsByGroupAndUserAndStatus(group, user, GroupMemberStatus.ACTIVE)) {
            throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
        }
    }

    private GroupSummaryResponse toGroupSummaryResponse(Group group) {
        int memberCount = (int) groupMemberRepository.countByGroupAndStatus(group, GroupMemberStatus.ACTIVE);

        return new GroupSummaryResponse(
                group.getId(),
                group.getName(),
                group.getGoalName(),
                group.getTargetDays(),
                memberCount,
                0,
                memberCount,
                0.0
        );
    }

    private String createUniqueInviteCode() {
        for (int retryCount = 0; retryCount < MAX_INVITE_CODE_RETRY_COUNT; retryCount++) {
            String inviteCode = String.format("%06d", secureRandom.nextInt(INVITE_CODE_BOUND));
            if (!groupInviteRepository.existsByInviteCode(inviteCode)) {
                return inviteCode;
            }
        }

        throw new IllegalStateException("초대 코드를 생성할 수 없습니다.");
    }
}
