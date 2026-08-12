package com.wedit.server.mission.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.repository.MissionRepository;
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
    private MissionRepository missionRepository;

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
                "사용자가 물을 마시는 장면이 확인되어야 합니다."
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
    }
}
