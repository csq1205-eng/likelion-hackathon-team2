package com.welllog.server.group.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.welllog.server.group.dto.GroupCreateRequest;
import com.welllog.server.group.dto.GroupCreateResponse;
import com.welllog.server.group.dto.GroupInvitePreviewResponse;
import com.welllog.server.group.dto.GroupInviteResponse;
import com.welllog.server.group.dto.GroupJoinRequest;
import com.welllog.server.group.dto.GroupJoinResponse;
import com.welllog.server.group.dto.GroupListResponse;
import com.welllog.server.group.dto.GroupStatusResponse;
import com.welllog.server.group.repository.GroupInviteRepository;
import com.welllog.server.group.repository.GroupMemberRepository;
import com.welllog.server.group.repository.GroupRepository;
import com.welllog.server.user.domain.SocialProvider;
import com.welllog.server.user.domain.User;
import com.welllog.server.user.repository.UserRepository;
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
}
