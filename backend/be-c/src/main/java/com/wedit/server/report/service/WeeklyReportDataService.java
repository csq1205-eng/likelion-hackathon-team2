package com.wedit.server.report.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.report.dto.WeeklyDailyReportDataResponse;
import com.wedit.server.report.dto.WeeklyMissionResultRow;
import com.wedit.server.report.dto.WeeklyMissionTypeReportDataResponse;
import com.wedit.server.report.dto.WeeklyReportDataResponse;
import com.wedit.server.report.dto.WeeklySlotReportDataResponse;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeeklyReportDataService {

    private static final int WEEK_DAYS = 7;
    private static final String UNKNOWN_VALUE = "UNKNOWN";

    private final UserRepository userRepository;
    private final MissionRepository missionRepository;

    public WeeklyReportDataService(
            UserRepository userRepository,
            MissionRepository missionRepository
    ) {
        this.userRepository = userRepository;
        this.missionRepository = missionRepository;
    }

    @Transactional(readOnly = true)
    public WeeklyReportDataResponse getWeeklyReportData(Long userId, LocalDate weekStartDate) {
        User user = findUser(userId);
        LocalDate startDate = normalizeWeekStartDate(weekStartDate);
        LocalDate endDate = startDate.plusDays(WEEK_DAYS - 1L);
        List<MissionReportItem> missionItems = findMissionReportItems(user, startDate, endDate);
        List<WeeklyDailyReportDataResponse> dailyStats = createDailyStats(startDate, missionItems);
        List<WeeklyMissionTypeReportDataResponse> missionTypeStats = createMissionTypeStats(missionItems);
        List<WeeklySlotReportDataResponse> slotStats = createSlotStats(missionItems);
        MissionAggregate totalAggregate = MissionAggregate.from(missionItems);

        return new WeeklyReportDataResponse(
                user.getId(),
                startDate,
                endDate,
                totalAggregate.totalMissionCount(),
                totalAggregate.completedMissionCount(),
                totalAggregate.failedMissionCount(),
                totalAggregate.notSubmittedMissionCount(),
                totalAggregate.completionRate(),
                countAchievedDays(dailyStats),
                calculateCurrentStreakDays(dailyStats),
                calculateLongestStreakDays(dailyStats),
                dailyStats,
                missionTypeStats,
                slotStats
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private LocalDate normalizeWeekStartDate(LocalDate weekStartDate) {
        if (weekStartDate != null) {
            return weekStartDate;
        }

        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private List<MissionReportItem> findMissionReportItems(User user, LocalDate startDate, LocalDate endDate) {
        Map<Long, MissionReportItem> missionItems = new LinkedHashMap<>();
        for (WeeklyMissionResultRow row : missionRepository.findWeeklyReportRows(user, startDate, endDate)) {
            MissionReportItem missionItem = missionItems.computeIfAbsent(
                    row.missionId(),
                    missionId -> new MissionReportItem(
                            row.missionId(),
                            row.missionDate(),
                            normalizeValue(row.slot()),
                            normalizeValue(row.missionType())
                    )
            );
            missionItem.applyResult(row.result());
        }

        return new ArrayList<>(missionItems.values());
    }

    private String normalizeValue(String value) {
        if (value == null || value.isBlank()) {
            return UNKNOWN_VALUE;
        }

        return value;
    }

    private List<WeeklyDailyReportDataResponse> createDailyStats(
            LocalDate startDate,
            List<MissionReportItem> missionItems
    ) {
        List<WeeklyDailyReportDataResponse> dailyStats = new ArrayList<>();
        for (int dayOffset = 0; dayOffset < WEEK_DAYS; dayOffset++) {
            LocalDate date = startDate.plusDays(dayOffset);
            List<MissionReportItem> dailyMissionItems = missionItems.stream()
                    .filter(missionItem -> missionItem.missionDate().equals(date))
                    .toList();
            MissionAggregate aggregate = MissionAggregate.from(dailyMissionItems);

            dailyStats.add(new WeeklyDailyReportDataResponse(
                    date,
                    aggregate.totalMissionCount(),
                    aggregate.completedMissionCount(),
                    aggregate.failedMissionCount(),
                    aggregate.notSubmittedMissionCount(),
                    aggregate.completionRate(),
                    aggregate.isAchieved()
            ));
        }

        return dailyStats;
    }

    private List<WeeklyMissionTypeReportDataResponse> createMissionTypeStats(List<MissionReportItem> missionItems) {
        return createGroupedStats(missionItems, MissionReportItem::missionType).entrySet()
                .stream()
                .map(entry -> {
                    MissionAggregate aggregate = MissionAggregate.from(entry.getValue());
                    return new WeeklyMissionTypeReportDataResponse(
                            entry.getKey(),
                            aggregate.totalMissionCount(),
                            aggregate.completedMissionCount(),
                            aggregate.failedMissionCount(),
                            aggregate.notSubmittedMissionCount(),
                            aggregate.completionRate()
                    );
                })
                .sorted(Comparator.comparing(WeeklyMissionTypeReportDataResponse::missionType))
                .toList();
    }

    private List<WeeklySlotReportDataResponse> createSlotStats(List<MissionReportItem> missionItems) {
        return createGroupedStats(missionItems, MissionReportItem::slot).entrySet()
                .stream()
                .map(entry -> {
                    MissionAggregate aggregate = MissionAggregate.from(entry.getValue());
                    return new WeeklySlotReportDataResponse(
                            entry.getKey(),
                            aggregate.totalMissionCount(),
                            aggregate.completedMissionCount(),
                            aggregate.failedMissionCount(),
                            aggregate.notSubmittedMissionCount(),
                            aggregate.completionRate()
                    );
                })
                .sorted(Comparator.comparing(WeeklySlotReportDataResponse::slot))
                .toList();
    }

    private Map<String, List<MissionReportItem>> createGroupedStats(
            List<MissionReportItem> missionItems,
            MissionGroupKeyResolver groupKeyResolver
    ) {
        Map<String, List<MissionReportItem>> groupedStats = new LinkedHashMap<>();
        for (MissionReportItem missionItem : missionItems) {
            groupedStats.computeIfAbsent(groupKeyResolver.resolve(missionItem), key -> new ArrayList<>())
                    .add(missionItem);
        }

        return groupedStats;
    }

    private int countAchievedDays(List<WeeklyDailyReportDataResponse> dailyStats) {
        return (int) dailyStats.stream()
                .filter(WeeklyDailyReportDataResponse::achieved)
                .count();
    }

    private int calculateCurrentStreakDays(List<WeeklyDailyReportDataResponse> dailyStats) {
        int currentStreakDays = 0;
        for (int index = dailyStats.size() - 1; index >= 0; index--) {
            if (!dailyStats.get(index).achieved()) {
                break;
            }
            currentStreakDays++;
        }

        return currentStreakDays;
    }

    private int calculateLongestStreakDays(List<WeeklyDailyReportDataResponse> dailyStats) {
        int longestStreakDays = 0;
        int currentStreakDays = 0;
        for (WeeklyDailyReportDataResponse dailyStat : dailyStats) {
            if (dailyStat.achieved()) {
                currentStreakDays++;
                longestStreakDays = Math.max(longestStreakDays, currentStreakDays);
                continue;
            }
            currentStreakDays = 0;
        }

        return longestStreakDays;
    }

    private interface MissionGroupKeyResolver {

        String resolve(MissionReportItem missionItem);
    }

    private static class MissionReportItem {

        private final Long missionId;
        private final LocalDate missionDate;
        private final String slot;
        private final String missionType;
        private boolean hasResult;
        private boolean completed;

        private MissionReportItem(
                Long missionId,
                LocalDate missionDate,
                String slot,
                String missionType
        ) {
            this.missionId = missionId;
            this.missionDate = missionDate;
            this.slot = slot;
            this.missionType = missionType;
        }

        private void applyResult(MissionResultType result) {
            if (result == null) {
                return;
            }
            this.hasResult = true;
            if (result == MissionResultType.PASS) {
                this.completed = true;
            }
        }

        private LocalDate missionDate() {
            return missionDate;
        }

        private String slot() {
            return slot;
        }

        private String missionType() {
            return missionType;
        }

        private boolean isCompleted() {
            return completed;
        }

        private boolean isFailed() {
            return hasResult && !completed;
        }

        private boolean isNotSubmitted() {
            return !hasResult;
        }
    }

    private record MissionAggregate(
            int totalMissionCount,
            int completedMissionCount,
            int failedMissionCount,
            int notSubmittedMissionCount
    ) {

        private static MissionAggregate from(List<MissionReportItem> missionItems) {
            int completedMissionCount = (int) missionItems.stream()
                    .filter(MissionReportItem::isCompleted)
                    .count();
            int failedMissionCount = (int) missionItems.stream()
                    .filter(MissionReportItem::isFailed)
                    .count();
            int notSubmittedMissionCount = (int) missionItems.stream()
                    .filter(MissionReportItem::isNotSubmitted)
                    .count();

            return new MissionAggregate(
                    missionItems.size(),
                    completedMissionCount,
                    failedMissionCount,
                    notSubmittedMissionCount
            );
        }

        private double completionRate() {
            if (totalMissionCount == 0) {
                return 0.0;
            }

            return completedMissionCount * 100.0 / totalMissionCount;
        }

        private boolean isAchieved() {
            return totalMissionCount > 0 && completedMissionCount == totalMissionCount;
        }
    }
}
