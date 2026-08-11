package com.wedit.server.group.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.group.dto.GroupCreateRequest;
import com.wedit.server.group.dto.GroupCreateResponse;
import com.wedit.server.group.dto.GardenCompletionResponse;
import com.wedit.server.group.dto.GroupInvitePreviewResponse;
import com.wedit.server.group.dto.GroupInviteResponse;
import com.wedit.server.group.dto.GroupJoinRequest;
import com.wedit.server.group.dto.GroupJoinResponse;
import com.wedit.server.group.dto.GroupListResponse;
import com.wedit.server.group.dto.GroupProgressResponse;
import com.wedit.server.group.dto.GroupStatusResponse;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupStatus;
import com.wedit.server.group.repository.GroupInviteRepository;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionResult;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.reward.repository.RewardGrantRepository;
import com.wedit.server.reward.repository.RewardRepository;
import com.wedit.server.stamp.domain.StampType;
import com.wedit.server.stamp.repository.StampRepository;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class GroupServiceTest {

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupInviteRepository groupInviteRepository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private MissionResultRepository missionResultRepository;

    @Autowired
    private StampRepository stampRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private RewardGrantRepository rewardGrantRepository;

    @Test
    @DisplayName("그룹을 생성하고 생성자를 OWNER 멤버로 등록하며 초대 코드를 발급한다")
    void createGroup() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-group-1",
                "group@example.com",
                "정효림",
                null
        ));

        GroupCreateResponse response = groupService.createGroup(
                user.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 21)
        );

        assertThat(response.groupId()).isNotNull();
        assertThat(response.name()).isEqualTo("아침 루틴 챌린지");
        assertThat(response.goalName()).isEqualTo("21일 W 정원 완성");
        assertThat(response.targetDays()).isEqualTo(21);
        assertThat(response.inviteCode()).hasSize(6);
        assertThat(groupRepository.findById(response.groupId())).isPresent();
        assertThat(groupMemberRepository.count()).isEqualTo(1);
        assertThat(groupInviteRepository.existsByInviteCode(response.inviteCode())).isTrue();
    }

    @Test
    @DisplayName("내 그룹 목록, 초대 정보, 초대 미리보기, 참여, 완료 현황을 조회한다")
    void groupFlow() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-group-owner",
                "owner@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-group-member",
                "member@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 21)
        );

        GroupListResponse ownerGroups = groupService.getMyGroups(owner.getId());
        GroupInviteResponse invite = groupService.getGroupInvite(owner.getId(), createdGroup.groupId());
        GroupInvitePreviewResponse preview = groupService.previewGroupInvite(member.getId(), invite.inviteCode());
        GroupJoinResponse joined = groupService.joinGroup(member.getId(), new GroupJoinRequest(invite.inviteCode()));
        GroupStatusResponse status = groupService.getGroupStatus(owner.getId(), createdGroup.groupId(), null);

        assertThat(ownerGroups.groups()).hasSize(1);
        assertThat(invite.inviteCode()).isEqualTo(createdGroup.inviteCode());
        assertThat(preview.joinable()).isTrue();
        assertThat(preview.memberCount()).isEqualTo(1);
        assertThat(joined.groupId()).isEqualTo(createdGroup.groupId());
        assertThat(joined.userId()).isEqualTo(member.getId());
        assertThat(joined.role()).isEqualTo("MEMBER");
        assertThat(status.memberCount()).isEqualTo(2);
        assertThat(status.completedMemberCount()).isZero();
        assertThat(status.members()).hasSize(2);
    }

    @Test
    @DisplayName("그룹 완료 현황은 미션 판정 PASS 결과를 기준으로 집계한다")
    void getGroupStatusAggregatesMissionPassResults() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-group-owner-status",
                "owner-status@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-group-member-status",
                "member-status@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 21)
        );
        Group group = groupRepository.findById(createdGroup.groupId()).orElseThrow();
        groupService.joinGroup(member.getId(), new GroupJoinRequest(createdGroup.inviteCode()));
        LocalDate missionDate = LocalDate.of(2026, 8, 15);

        saveMissionResults(group, owner, missionDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        saveMissionResults(group, member, missionDate, MissionResultType.PASS, MissionResultType.FAIL, MissionResultType.PASS);

        GroupStatusResponse status = groupService.getGroupStatus(owner.getId(), group.getId(), missionDate);

        assertThat(status.memberCount()).isEqualTo(2);
        assertThat(status.completedMemberCount()).isEqualTo(1);
        assertThat(status.completionRate()).isEqualTo(50.0);
        assertThat(status.allCompleted()).isFalse();
        assertThat(status.members())
                .filteredOn(memberStatus -> memberStatus.userId().equals(owner.getId()))
                .singleElement()
                .satisfies(memberStatus -> {
                    assertThat(memberStatus.completedMissionCount()).isEqualTo(3);
                    assertThat(memberStatus.requiredMissionCount()).isEqualTo(3);
                    assertThat(memberStatus.completed()).isTrue();
                });
        assertThat(status.members())
                .filteredOn(memberStatus -> memberStatus.userId().equals(member.getId()))
                .singleElement()
                .satisfies(memberStatus -> {
                    assertThat(memberStatus.completedMissionCount()).isEqualTo(2);
                    assertThat(memberStatus.requiredMissionCount()).isEqualTo(3);
                    assertThat(memberStatus.completed()).isFalse();
                });
    }

    @Test
    @DisplayName("하루 완료 조건을 만족한 개인과 그룹에 스탬프를 지급하고 중복 지급하지 않는다")
    void issueDailyStamps() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-stamp-owner",
                "stamp-owner@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-stamp-member",
                "stamp-member@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 21)
        );
        Group group = groupRepository.findById(createdGroup.groupId()).orElseThrow();
        groupService.joinGroup(member.getId(), new GroupJoinRequest(createdGroup.inviteCode()));
        LocalDate stampDate = LocalDate.of(2026, 8, 15);

        saveMissionResults(group, owner, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        saveMissionResults(group, member, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);

        var firstResponse = groupService.issueDailyStamps(owner.getId(), group.getId(), stampDate);
        var secondResponse = groupService.issueDailyStamps(owner.getId(), group.getId(), stampDate);

        assertThat(firstResponse.memberCount()).isEqualTo(2);
        assertThat(firstResponse.completedMemberCount()).isEqualTo(2);
        assertThat(firstResponse.personalStampCount()).isEqualTo(2);
        assertThat(firstResponse.groupStampIssued()).isTrue();
        assertThat(firstResponse.groupStampId()).isNotNull();
        assertThat(firstResponse.personalStamps())
                .extracting("newlyIssued")
                .containsOnly(true);
        assertThat(secondResponse.personalStamps())
                .extracting("newlyIssued")
                .containsOnly(false);
        assertThat(secondResponse.groupStampId()).isEqualTo(firstResponse.groupStampId());
        assertThat(stampRepository.count()).isEqualTo(3);
        assertThat(stampRepository.findByGroupAndStampTypeAndStampDate(
                group,
                StampType.GROUP,
                stampDate
        )).isPresent();
    }

    @Test
    @DisplayName("그룹 목표 진행률은 그룹 스탬프 수를 목표 일수 대비 비율로 계산한다")
    void getGroupProgress() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-progress-owner",
                "progress-owner@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-progress-member",
                "progress-member@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 21)
        );
        Group group = groupRepository.findById(createdGroup.groupId()).orElseThrow();
        groupService.joinGroup(member.getId(), new GroupJoinRequest(createdGroup.inviteCode()));
        LocalDate stampDate = LocalDate.of(2026, 8, 15);

        saveMissionResults(group, owner, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        saveMissionResults(group, member, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        groupService.issueDailyStamps(owner.getId(), group.getId(), stampDate);

        GroupProgressResponse response = groupService.getGroupProgress(owner.getId(), group.getId());

        assertThat(response.groupId()).isEqualTo(group.getId());
        assertThat(response.targetDays()).isEqualTo(21);
        assertThat(response.completedDays()).isEqualTo(1);
        assertThat(response.remainingDays()).isEqualTo(20);
        assertThat(response.progressRate()).isEqualTo(100.0 / 21.0);
        assertThat(response.completed()).isFalse();
        assertThat(response.personalStampCount()).isEqualTo(2);
        assertThat(response.groupStampCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("개인과 그룹 스탬프가 목표만큼 모이면 리워드를 지급하고 중복 지급하지 않는다")
    void claimGroupReward() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-reward-owner",
                "reward-owner@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-reward-member",
                "reward-member@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("하루 완성 챌린지", "1일 W 정원 완성", 1)
        );
        Group group = groupRepository.findById(createdGroup.groupId()).orElseThrow();
        groupService.joinGroup(member.getId(), new GroupJoinRequest(createdGroup.inviteCode()));

        var beforeEligibleResponse = groupService.claimGroupReward(owner.getId(), group.getId());
        assertThat(beforeEligibleResponse.eligible()).isFalse();
        assertThat(beforeEligibleResponse.rewardGrantId()).isNull();

        LocalDate stampDate = LocalDate.of(2026, 8, 15);
        saveMissionResults(group, owner, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        saveMissionResults(group, member, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        groupService.issueDailyStamps(owner.getId(), group.getId(), stampDate);

        var firstResponse = groupService.claimGroupReward(owner.getId(), group.getId());
        var secondResponse = groupService.claimGroupReward(owner.getId(), group.getId());

        assertThat(firstResponse.eligible()).isTrue();
        assertThat(firstResponse.newlyGranted()).isTrue();
        assertThat(firstResponse.rewardGrantId()).isNotNull();
        assertThat(firstResponse.rewardId()).isNotNull();
        assertThat(firstResponse.rewardName()).isEqualTo("W 정원 완성 리워드");
        assertThat(firstResponse.personalStampCount()).isEqualTo(1);
        assertThat(firstResponse.groupStampCount()).isEqualTo(1);
        assertThat(secondResponse.eligible()).isTrue();
        assertThat(secondResponse.newlyGranted()).isFalse();
        assertThat(secondResponse.rewardGrantId()).isEqualTo(firstResponse.rewardGrantId());
        assertThat(rewardRepository.count()).isEqualTo(1);
        assertThat(rewardGrantRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("W 정원 완성 조건을 만족하면 그룹을 완료 처리하고 리워드를 트리거한다")
    void completeGarden() {
        User owner = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-garden-owner",
                "garden-owner@example.com",
                "효림",
                null
        ));
        User member = userRepository.save(User.create(
                SocialProvider.GOOGLE,
                "google-garden-member",
                "garden-member@example.com",
                "민교",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                owner.getId(),
                new GroupCreateRequest("하루 완성 챌린지", "1일 W 정원 완성", 1)
        );
        Group group = groupRepository.findById(createdGroup.groupId()).orElseThrow();
        groupService.joinGroup(member.getId(), new GroupJoinRequest(createdGroup.inviteCode()));

        GardenCompletionResponse beforeResponse = groupService.completeGarden(owner.getId(), group.getId());
        assertThat(beforeResponse.completed()).isFalse();
        assertThat(beforeResponse.groupStatus()).isEqualTo("ACTIVE");
        assertThat(beforeResponse.reward()).isNull();

        LocalDate stampDate = LocalDate.of(2026, 8, 15);
        saveMissionResults(group, owner, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        saveMissionResults(group, member, stampDate, MissionResultType.PASS, MissionResultType.PASS, MissionResultType.PASS);
        groupService.issueDailyStamps(owner.getId(), group.getId(), stampDate);

        GardenCompletionResponse firstResponse = groupService.completeGarden(owner.getId(), group.getId());
        GardenCompletionResponse secondResponse = groupService.completeGarden(owner.getId(), group.getId());

        assertThat(firstResponse.completed()).isTrue();
        assertThat(firstResponse.newlyCompleted()).isTrue();
        assertThat(firstResponse.groupStatus()).isEqualTo("COMPLETED");
        assertThat(firstResponse.completedAt()).isNotNull();
        assertThat(firstResponse.reward()).isNotNull();
        assertThat(firstResponse.reward().eligible()).isTrue();
        assertThat(firstResponse.reward().newlyGranted()).isTrue();
        assertThat(secondResponse.completed()).isTrue();
        assertThat(secondResponse.newlyCompleted()).isFalse();
        assertThat(secondResponse.reward().newlyGranted()).isFalse();
        assertThat(group.getStatus()).isEqualTo(GroupStatus.COMPLETED);
        assertThat(group.getCompletedAt()).isNotNull();
    }

    private void saveMissionResults(
            Group group,
            User user,
            LocalDate missionDate,
            MissionResultType firstResult,
            MissionResultType secondResult,
            MissionResultType thirdResult
    ) {
        saveMissionResult(group, user, missionDate, "MORNING", firstResult, 10_000L + user.getId() * 10);
        saveMissionResult(group, user, missionDate, "NOON", secondResult, 10_001L + user.getId() * 10);
        saveMissionResult(group, user, missionDate, "EVENING", thirdResult, 10_002L + user.getId() * 10);
    }

    private void saveMissionResult(
            Group group,
            User user,
            LocalDate missionDate,
            String slot,
            MissionResultType result,
            Long clipId
    ) {
        Mission mission = missionRepository.save(Mission.create(
                user,
                group,
                missionDate,
                slot,
                slot + " 미션",
                "테스트 미션입니다.",
                "TEST"
        ));
        missionResultRepository.save(MissionResult.create(mission, clipId, user, result));
    }
}
