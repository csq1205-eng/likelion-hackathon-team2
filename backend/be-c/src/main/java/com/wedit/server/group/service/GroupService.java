package com.wedit.server.group.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupInvite;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.dto.GroupCreateRequest;
import com.wedit.server.group.dto.GroupCreateResponse;
import com.wedit.server.group.dto.DailyStampIssueResponse;
import com.wedit.server.group.dto.GardenCompletionResponse;
import com.wedit.server.group.dto.GroupInvitePreviewResponse;
import com.wedit.server.group.dto.GroupInviteResponse;
import com.wedit.server.group.dto.GroupJoinRequest;
import com.wedit.server.group.dto.GroupJoinResponse;
import com.wedit.server.group.dto.GroupListResponse;
import com.wedit.server.group.dto.GroupMemberStatusResponse;
import com.wedit.server.group.dto.PersonalStampResponse;
import com.wedit.server.group.dto.GroupProgressResponse;
import com.wedit.server.group.dto.GroupPreviewMemberResponse;
import com.wedit.server.group.dto.GroupStatusResponse;
import com.wedit.server.group.dto.GroupSummaryResponse;
import com.wedit.server.group.dto.RewardClaimResponse;
import com.wedit.server.group.repository.GroupInviteRepository;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.reward.domain.Reward;
import com.wedit.server.reward.domain.RewardGrant;
import com.wedit.server.reward.domain.RewardType;
import com.wedit.server.reward.repository.RewardGrantRepository;
import com.wedit.server.reward.repository.RewardRepository;
import com.wedit.server.stamp.domain.Stamp;
import com.wedit.server.stamp.domain.StampType;
import com.wedit.server.stamp.repository.StampRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupService {

    private static final String INVITE_URL_PREFIX = "https://wedit.app/groups/join?code=";
    private static final int INVITE_CODE_BOUND = 1_000_000;
    private static final int MAX_INVITE_CODE_RETRY_COUNT = 10;
    private static final int REQUIRED_DAILY_MISSION_COUNT = 3;
    private static final String DEFAULT_REWARD_NAME = "W 정원 완성 리워드";

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupInviteRepository groupInviteRepository;
    private final MissionResultRepository missionResultRepository;
    private final StampRepository stampRepository;
    private final RewardRepository rewardRepository;
    private final RewardGrantRepository rewardGrantRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public GroupService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            GroupInviteRepository groupInviteRepository,
            MissionResultRepository missionResultRepository,
            StampRepository stampRepository,
            RewardRepository rewardRepository,
            RewardGrantRepository rewardGrantRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupInviteRepository = groupInviteRepository;
        this.missionResultRepository = missionResultRepository;
        this.stampRepository = stampRepository;
        this.rewardRepository = rewardRepository;
        this.rewardGrantRepository = rewardGrantRepository;
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
                .map(member -> toGroupMemberStatusResponse(group, member, responseDate))
                .toList();
        int completedMemberCount = (int) members.stream()
                .filter(GroupMemberStatusResponse::completed)
                .count();
        double completionRate = activeMembers.isEmpty()
                ? 0.0
                : completedMemberCount * 100.0 / activeMembers.size();

        return new GroupStatusResponse(
                group.getId(),
                responseDate,
                activeMembers.size(),
                completedMemberCount,
                completionRate,
                !activeMembers.isEmpty() && completedMemberCount == activeMembers.size(),
                members
        );
    }

    @Transactional
    public DailyStampIssueResponse issueDailyStamps(Long userId, Long groupId, LocalDate date) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        LocalDate stampDate = date == null ? LocalDate.now() : date;
        List<GroupMember> activeMembers = groupMemberRepository.findAllByGroupAndStatus(
                group,
                GroupMemberStatus.ACTIVE
        );
        List<GroupMember> completedMembers = activeMembers.stream()
                .filter(member -> countPassedMissions(group, member.getUser(), stampDate) >= REQUIRED_DAILY_MISSION_COUNT)
                .toList();
        List<PersonalStampResponse> personalStamps = completedMembers.stream()
                .map(member -> issuePersonalStamp(group, member, stampDate))
                .toList();
        Stamp groupStamp = null;
        if (!activeMembers.isEmpty() && completedMembers.size() == activeMembers.size()) {
            groupStamp = issueGroupStamp(group, stampDate);
        }

        return new DailyStampIssueResponse(
                group.getId(),
                stampDate,
                activeMembers.size(),
                completedMembers.size(),
                personalStamps.size(),
                groupStamp != null,
                groupStamp == null ? null : groupStamp.getId(),
                personalStamps
        );
    }

    @Transactional(readOnly = true)
    public GroupProgressResponse getGroupProgress(Long userId, Long groupId) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        int groupStampCount = countGroupStamps(group);
        int personalStampCount = countPersonalStamps(group);
        int completedDays = Math.min(groupStampCount, group.getTargetDays());
        int remainingDays = Math.max(group.getTargetDays() - completedDays, 0);
        double progressRate = calculateProgressRate(completedDays, group.getTargetDays());

        return new GroupProgressResponse(
                group.getId(),
                group.getName(),
                group.getGoalName(),
                group.getTargetDays(),
                completedDays,
                remainingDays,
                progressRate,
                completedDays >= group.getTargetDays(),
                personalStampCount,
                groupStampCount
        );
    }

    @Transactional
    public RewardClaimResponse claimGroupReward(Long userId, Long groupId) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        int requiredStampCount = group.getTargetDays();
        int personalStampCount = countPersonalStamps(user, group);
        int groupStampCount = countGroupStamps(group);
        boolean eligible = personalStampCount >= requiredStampCount && groupStampCount >= requiredStampCount;
        if (!eligible) {
            return new RewardClaimResponse(
                    group.getId(),
                    user.getId(),
                    false,
                    false,
                    null,
                    null,
                    null,
                    requiredStampCount,
                    personalStampCount,
                    requiredStampCount,
                    groupStampCount,
                    "개인 스탬프와 그룹 스탬프가 모두 목표 일수만큼 모여야 합니다."
            );
        }

        Reward reward = findOrCreateDefaultReward();
        RewardGrant existingGrant = rewardGrantRepository.findByUserAndGroup(user, group).orElse(null);
        if (existingGrant != null) {
            return toRewardClaimResponse(group, user, reward, existingGrant, false, personalStampCount, groupStampCount);
        }

        RewardGrant rewardGrant = rewardGrantRepository.save(RewardGrant.create(user, reward, group));
        return toRewardClaimResponse(group, user, reward, rewardGrant, true, personalStampCount, groupStampCount);
    }

    @Transactional
    public GardenCompletionResponse completeGarden(Long userId, Long groupId) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);

        int targetDays = group.getTargetDays();
        int personalStampCount = countPersonalStamps(user, group);
        int groupStampCount = countGroupStamps(group);
        boolean completed = personalStampCount >= targetDays && groupStampCount >= targetDays;
        boolean newlyCompleted = false;
        RewardClaimResponse reward = null;
        if (completed) {
            newlyCompleted = group.complete();
            reward = claimGroupReward(userId, groupId);
        }

        return new GardenCompletionResponse(
                group.getId(),
                user.getId(),
                completed,
                newlyCompleted,
                group.getStatus().name(),
                group.getCompletedAt(),
                targetDays,
                personalStampCount,
                groupStampCount,
                reward
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
        int groupStampCount = countGroupStamps(group);

        return new GroupSummaryResponse(
                group.getId(),
                group.getName(),
                group.getGoalName(),
                group.getTargetDays(),
                memberCount,
                0,
                memberCount,
                calculateProgressRate(groupStampCount, group.getTargetDays())
        );
    }

    private GroupMemberStatusResponse toGroupMemberStatusResponse(
            Group group,
            GroupMember member,
            LocalDate date
    ) {
        long passCount = countPassedMissions(group, member.getUser(), date);
        int completedMissionCount = (int) Math.min(passCount, REQUIRED_DAILY_MISSION_COUNT);

        return new GroupMemberStatusResponse(
                member.getUser().getId(),
                member.getUser().getNickname(),
                completedMissionCount,
                REQUIRED_DAILY_MISSION_COUNT,
                passCount >= REQUIRED_DAILY_MISSION_COUNT
        );
    }

    private long countPassedMissions(Group group, User user, LocalDate date) {
        return missionResultRepository.countPassedMissions(
                group,
                user,
                date,
                MissionResultType.PASS
        );
    }

    private PersonalStampResponse issuePersonalStamp(Group group, GroupMember member, LocalDate stampDate) {
        User stampUser = member.getUser();
        Stamp existingStamp = stampRepository.findByUserAndGroupAndStampTypeAndStampDate(
                stampUser,
                group,
                StampType.PERSONAL,
                stampDate
        ).orElse(null);
        if (existingStamp != null) {
            return new PersonalStampResponse(
                    stampUser.getId(),
                    stampUser.getNickname(),
                    existingStamp.getId(),
                    false
            );
        }

        Stamp stamp = stampRepository.save(Stamp.createPersonal(stampUser, group, stampDate));
        return new PersonalStampResponse(
                stampUser.getId(),
                stampUser.getNickname(),
                stamp.getId(),
                true
        );
    }

    private Stamp issueGroupStamp(Group group, LocalDate stampDate) {
        return stampRepository.findByGroupAndStampTypeAndStampDate(
                group,
                StampType.GROUP,
                stampDate
        ).orElseGet(() -> stampRepository.save(Stamp.createGroup(group, stampDate)));
    }

    private int countGroupStamps(Group group) {
        return (int) stampRepository.countByGroupAndStampType(group, StampType.GROUP);
    }

    private int countPersonalStamps(Group group) {
        return (int) stampRepository.countPersonalStampsByGroup(group, StampType.PERSONAL);
    }

    private int countPersonalStamps(User user, Group group) {
        return (int) stampRepository.countByUserAndGroupAndStampType(user, group, StampType.PERSONAL);
    }

    private double calculateProgressRate(int completedDays, int targetDays) {
        if (targetDays <= 0) {
            return 0.0;
        }

        return Math.min(completedDays * 100.0 / targetDays, 100.0);
    }

    private Reward findOrCreateDefaultReward() {
        return rewardRepository.findFirstByActiveTrueOrderByIdAsc()
                .orElseGet(() -> rewardRepository.save(Reward.create(
                        DEFAULT_REWARD_NAME,
                        RewardType.SPONSOR,
                        "개인 스탬프와 그룹 스탬프 목표를 모두 달성하면 지급됩니다."
                )));
    }

    private RewardClaimResponse toRewardClaimResponse(
            Group group,
            User user,
            Reward reward,
            RewardGrant rewardGrant,
            boolean newlyGranted,
            int personalStampCount,
            int groupStampCount
    ) {
        return new RewardClaimResponse(
                group.getId(),
                user.getId(),
                true,
                newlyGranted,
                rewardGrant.getId(),
                reward.getId(),
                reward.getName(),
                group.getTargetDays(),
                personalStampCount,
                group.getTargetDays(),
                groupStampCount,
                newlyGranted ? "리워드가 지급되었습니다." : "이미 지급된 리워드입니다."
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
