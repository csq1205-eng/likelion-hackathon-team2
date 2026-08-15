package com.wedit.server.user.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.dto.MissionHistoryDayResponse;
import com.wedit.server.user.dto.MissionHistoryResponse;
import com.wedit.server.user.dto.UserStreakResponse;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserRecordService {

    private static final int REQUIRED_DAILY_MISSION_COUNT = 3;

    private final UserRepository userRepository;
    private final MissionRepository missionRepository;
    private final MissionResultRepository missionResultRepository;

    public UserRecordService(
            UserRepository userRepository,
            MissionRepository missionRepository,
            MissionResultRepository missionResultRepository
    ) {
        this.userRepository = userRepository;
        this.missionRepository = missionRepository;
        this.missionResultRepository = missionResultRepository;
    }

    @Transactional(readOnly = true)
    public UserStreakResponse getStreak(Long userId) {
        User user = findUser(userId);
        List<LocalDate> completedDates = missionResultRepository.findCompletedDates(
                user,
                MissionResultType.PASS,
                REQUIRED_DAILY_MISSION_COUNT
        );
        Set<LocalDate> completedDateSet = new HashSet<>(completedDates);
        LocalDate lastCompletedDate = completedDates.isEmpty() ? null : completedDates.get(0);
        int currentStreakDays = calculateCurrentStreakDays(completedDateSet);
        int longestStreakDays = calculateLongestStreakDays(completedDates);

        return new UserStreakResponse(user.getId(), currentStreakDays, longestStreakDays, lastCompletedDate);
    }

    @Transactional(readOnly = true)
    public MissionHistoryResponse getMissionHistory(Long userId, int year, int month) {
        User user = findUser(userId);
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        List<Mission> missions = missionRepository.findAllByUserAndMissionDateBetweenOrderByMissionDateAscIdAsc(
                user,
                startDate,
                endDate
        );
        Map<LocalDate, List<Mission>> missionsByDate = missions.stream()
                .collect(Collectors.groupingBy(Mission::getMissionDate));
        Set<Long> passedMissionIds = new HashSet<>(missionResultRepository.findPassedMissionIds(
                user,
                MissionResultType.PASS,
                startDate,
                endDate
        ));

        List<MissionHistoryDayResponse> days = startDate.datesUntil(endDate.plusDays(1))
                .filter(missionsByDate::containsKey)
                .map(date -> toMissionHistoryDayResponse(date, missionsByDate, passedMissionIds))
                .toList();

        return new MissionHistoryResponse(user.getId(), year, month, days);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private int calculateCurrentStreakDays(Set<LocalDate> completedDates) {
        LocalDate cursor = LocalDate.now();
        if (!completedDates.contains(cursor)) {
            cursor = cursor.minusDays(1);
        }

        int streakDays = 0;
        while (completedDates.contains(cursor)) {
            streakDays++;
            cursor = cursor.minusDays(1);
        }

        return streakDays;
    }

    private int calculateLongestStreakDays(List<LocalDate> completedDates) {
        List<LocalDate> sortedDates = completedDates.stream()
                .sorted()
                .toList();
        int longest = 0;
        int current = 0;
        LocalDate previous = null;
        for (LocalDate date : sortedDates) {
            if (previous == null || previous.plusDays(1).equals(date)) {
                current++;
            } else {
                current = 1;
            }
            longest = Math.max(longest, current);
            previous = date;
        }

        return longest;
    }

    private MissionHistoryDayResponse toMissionHistoryDayResponse(
            LocalDate date,
            Map<LocalDate, List<Mission>> missionsByDate,
            Set<Long> passedMissionIds
    ) {
        List<Mission> missions = missionsByDate.get(date);
        int totalMissionCount = missions.size();
        int completedMissionCount = (int) missions.stream()
                .map(Mission::getId)
                .filter(passedMissionIds::contains)
                .count();

        return new MissionHistoryDayResponse(
                date,
                completedMissionCount,
                totalMissionCount,
                completedMissionCount >= REQUIRED_DAILY_MISSION_COUNT
        );
    }
}
