package com.wedit.server.reward.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.group.dto.GroupCreateRequest;
import com.wedit.server.group.dto.GroupCreateResponse;
import com.wedit.server.group.service.GroupService;
import com.wedit.server.reward.domain.RewardType;
import com.wedit.server.reward.dto.RewardGrantListResponse;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class RewardServiceTest {

    @Autowired
    private RewardService rewardService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("지급된 브랜드 스폰서 리워드 이력을 조회한다")
    void getRewardGrants() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-reward-user",
                "reward@example.com",
                "정효림",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                user.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 0)
        );
        groupService.claimGroupReward(user.getId(), createdGroup.groupId());

        RewardGrantListResponse response = rewardService.getRewardGrants(user.getId());

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.rewards()).hasSize(1);
        assertThat(response.rewards().get(0).groupId()).isEqualTo(createdGroup.groupId());
        assertThat(response.rewards().get(0).rewardType()).isEqualTo(RewardType.SPONSOR.name());
        assertThat(response.rewards().get(0).status()).isEqualTo("GRANTED");
    }
}
