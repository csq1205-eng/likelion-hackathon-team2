package com.wedit.server.report.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionResult;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.report.dto.WeeklyDailyReportDataResponse;
import com.wedit.server.report.dto.WeeklyMissionTypeReportDataResponse;
import com.wedit.server.report.dto.WeeklyReportDataResponse;
import com.wedit.server.report.dto.WeeklySlotReportDataResponse;
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
class WeeklyReportDataServiceTest {

    @Autowired
    private WeeklyReportDataService weeklyReportDataService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private MissionResultRepository missionResultRepository;

    @Test
    @DisplayName("개인별 주간 리포트 원천 데이터를 PASS 기준으로 집계한다")
    void getWeeklyReportData() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-weekly-report-user",
                "weekly-report@example.com",
                "정효림",
                null
        ));
        LocalDate weekStartDate = LocalDate.of(2026, 8, 3);

        saveMissionResult(user, weekStartDate, "MORNING", "HYDRATION", MissionResultType.PASS, 10_000L);
        saveMissionResult(user, weekStartDate, "NOON", "STRETCHING", MissionResultType.FAIL, 10_001L);
        saveMission(user, weekStartDate, "EVENING", "SLEEP");
        saveMissionResult(user, weekStartDate.plusDays(1), "MORNING", "HYDRATION", MissionResultType.PASS, 10_002L);
        saveMissionResult(user, weekStartDate.plusDays(1), "NOON", "STRETCHING", MissionResultType.PASS, 10_003L);
        Mission retriedMission = saveMissionResult(
                user,
                weekStartDate.plusDays(1),
                "EVENING",
                "SLEEP",
                MissionResultType.FAIL,
                10_004L
        );
        missionResultRepository.save(MissionResult.create(retriedMission, 10_005L, user, MissionResultType.PASS));

        WeeklyReportDataResponse response = weeklyReportDataService.getWeeklyReportData(
                user.getId(),
                weekStartDate
        );

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.weekStartDate()).isEqualTo(weekStartDate);
        assertThat(response.weekEndDate()).isEqualTo(LocalDate.of(2026, 8, 9));
        assertThat(response.totalMissionCount()).isEqualTo(6);
        assertThat(response.completedMissionCount()).isEqualTo(4);
        assertThat(response.failedMissionCount()).isEqualTo(1);
        assertThat(response.notSubmittedMissionCount()).isEqualTo(1);
        assertThat(response.completionRate()).isEqualTo(66.66666666666667);
        assertThat(response.achievedDayCount()).isEqualTo(1);
        assertThat(response.currentStreakDays()).isZero();
        assertThat(response.longestStreakDays()).isEqualTo(1);
        assertThat(response.dailyStats()).hasSize(7);

        WeeklyDailyReportDataResponse firstDay = response.dailyStats().get(0);
        assertThat(firstDay.totalMissionCount()).isEqualTo(3);
        assertThat(firstDay.completedMissionCount()).isEqualTo(1);
        assertThat(firstDay.failedMissionCount()).isEqualTo(1);
        assertThat(firstDay.notSubmittedMissionCount()).isEqualTo(1);
        assertThat(firstDay.achieved()).isFalse();

        WeeklyDailyReportDataResponse secondDay = response.dailyStats().get(1);
        assertThat(secondDay.totalMissionCount()).isEqualTo(3);
        assertThat(secondDay.completedMissionCount()).isEqualTo(3);
        assertThat(secondDay.achieved()).isTrue();

        assertThat(response.missionTypeStats())
                .filteredOn(stat -> stat.missionType().equals("HYDRATION"))
                .singleElement()
                .extracting(
                        WeeklyMissionTypeReportDataResponse::totalMissionCount,
                        WeeklyMissionTypeReportDataResponse::completedMissionCount,
                        WeeklyMissionTypeReportDataResponse::completionRate
                )
                .containsExactly(2, 2, 100.0);
        assertThat(response.slotStats())
                .filteredOn(stat -> stat.slot().equals("EVENING"))
                .singleElement()
                .extracting(
                        WeeklySlotReportDataResponse::totalMissionCount,
                        WeeklySlotReportDataResponse::completedMissionCount,
                        WeeklySlotReportDataResponse::notSubmittedMissionCount
                )
                .containsExactly(2, 1, 1);
    }

    private Mission saveMissionResult(
            User user,
            LocalDate missionDate,
            String slot,
            String missionType,
            MissionResultType result,
            Long clipId
    ) {
        Mission mission = saveMission(user, missionDate, slot, missionType);
        missionResultRepository.save(MissionResult.create(mission, clipId, user, result));

        return mission;
    }

    private Mission saveMission(
            User user,
            LocalDate missionDate,
            String slot,
            String missionType
    ) {
        return missionRepository.save(Mission.create(
                user,
                null,
                missionDate,
                slot,
                slot + " 미션",
                "테스트 미션입니다.",
                missionType
        ));
    }
}
