package com.wedit.server.mission.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionStatus;
import com.wedit.server.mission.dto.MissionResultCreateRequest;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.point.dto.PointResponse;
import com.wedit.server.point.service.PointService;
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
class MissionServiceTest {

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
    private PointService pointService;

    @Test
    @DisplayName("오늘 저장된 미션을 조회하고 저장된 ID를 missionId로 반환한다")
    void getTodayMissions() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-mission-user",
                "mission@example.com",
                "효림",
                null
        ));
        Mission mission = missionRepository.save(Mission.create(
                user,
                null,
                LocalDate.now(),
                "MORNING",
                "아침 물 한 잔 마시기",
                "기상 후 물을 마시고 인증 클립을 제출해 주세요.",
                "HYDRATION",
                "사용자가 물을 마시는 장면이 확인되어야 합니다.",
                "최근 수분 섭취량이 낮게 입력되어 추천되었습니다."
        ));

        TodayMissionResponse response = missionService.getTodayMissions(user.getId());

        assertThat(response.date()).isEqualTo(LocalDate.now());
        assertThat(response.missions()).hasSize(1);
        assertThat(response.missions().get(0).missionId()).isEqualTo(mission.getId());
        assertThat(response.missions().get(0).slot()).isEqualTo("MORNING");
        assertThat(response.missions().get(0).title()).isEqualTo("아침 물 한 잔 마시기");
        assertThat(response.missions().get(0).missionType()).isEqualTo("HYDRATION");
        assertThat(response.missions().get(0).verificationCriteria()).isEqualTo("사용자가 물을 마시는 장면이 확인되어야 합니다.");
        assertThat(response.missions().get(0).status()).isEqualTo("PENDING");
        assertThat(response.missions().get(0).reason()).isEqualTo("최근 수분 섭취량이 낮게 입력되어 추천되었습니다.");
    }

    @Test
    @DisplayName("활성 그룹이 있으면 오늘 미션 조회는 해당 그룹 미션을 하루 최대 3개만 반환한다")
    void getTodayMissionsReturnsDefaultGroupMissionsUpToThree() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-mission-group-user",
                "mission-group@example.com",
                "효림",
                null
        ));
        Group group = groupRepository.save(Group.create(user, "아침 루틴 챌린지", "21일 W 정원 완성", 21));
        groupMemberRepository.save(GroupMember.createOwner(group, user));
        LocalDate today = LocalDate.now();
        saveMission(user, null, today, "개인 미션 1");
        saveMission(user, null, today, "개인 미션 2");
        saveMission(user, null, today, "개인 미션 3");
        saveMission(user, group, today, "그룹 미션 1");
        saveMission(user, group, today, "그룹 미션 2");
        saveMission(user, group, today, "그룹 미션 3");
        saveMission(user, group, today, "그룹 미션 4");

        TodayMissionResponse response = missionService.getTodayMissions(user.getId());

        assertThat(response.missions()).hasSize(3);
        assertThat(response.missions())
                .extracting("title")
                .containsExactly("그룹 미션 1", "그룹 미션 2", "그룹 미션 3");
    }

    @Test
    @DisplayName("미션 판정 결과가 PASS이면 미션 상태를 PASSED로 변경한다")
    void saveMissionResultUpdatesMissionStatus() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-result-user",
                "result@example.com",
                "효림",
                null
        ));
        Mission mission = missionRepository.save(Mission.create(
                user,
                null,
                LocalDate.now(),
                "MORNING",
                "아침 물 한 잔 마시기",
                "기상 후 물을 마시고 인증 클립을 제출해 주세요.",
                "HYDRATION",
                "사용자가 물을 마시는 장면이 확인되어야 합니다."
        ));

        missionService.saveMissionResult(new MissionResultCreateRequest(
                mission.getId(),
                100L,
                "PASS",
                "물을 마시는 장면이 확인되었습니다.",
                null,
                null,
                null,
                null
        ));

        assertThat(mission.getStatus()).isEqualTo(MissionStatus.PASSED);
    }

    @Test
    @DisplayName("미션 판정 결과가 PASS이면 포인트를 적립하고 같은 미션은 중복 적립하지 않는다")
    void saveMissionResultEarnsPointOnce() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-point-user",
                "point@example.com",
                "정효림",
                null
        ));
        Mission mission = missionRepository.save(Mission.create(
                user,
                null,
                LocalDate.now(),
                "MORNING",
                "아침 물 한 잔 마시기",
                "기상 후 물을 마시고 인증 클립을 제출해 주세요.",
                "HYDRATION",
                "사용자가 물을 마시는 장면이 확인되어야 합니다."
        ));

        missionService.saveMissionResult(new MissionResultCreateRequest(
                mission.getId(),
                101L,
                "PASS",
                "물을 마시는 장면이 확인되었습니다.",
                null,
                null,
                null,
                null
        ));
        missionService.saveMissionResult(new MissionResultCreateRequest(
                mission.getId(),
                102L,
                "PASS",
                "재판정에서도 통과했습니다.",
                null,
                null,
                null,
                null
        ));

        PointResponse response = pointService.getPoints(user.getId());

        assertThat(response.balance()).isEqualTo(100);
        assertThat(response.totalEarned()).isEqualTo(100);
        assertThat(response.recentTransactions()).hasSize(1);
        assertThat(response.recentTransactions().get(0).transactionType()).isEqualTo("EARN");
    }

    private void saveMission(User user, Group group, LocalDate missionDate, String title) {
        missionRepository.save(Mission.create(
                user,
                group,
                missionDate,
                "MORNING",
                title,
                title + " 설명",
                "HYDRATION",
                "사용자가 미션을 수행하는 장면이 확인되어야 합니다."
        ));
    }
}
