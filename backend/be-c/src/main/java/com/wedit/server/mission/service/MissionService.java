package com.wedit.server.mission.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.dto.TodayMissionItemResponse;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MissionService {

    private final UserRepository userRepository;
    private final MissionRepository missionRepository;

    public MissionService(
            UserRepository userRepository,
            MissionRepository missionRepository
    ) {
        this.userRepository = userRepository;
        this.missionRepository = missionRepository;
    }

    @Transactional(readOnly = true)
    public TodayMissionResponse getTodayMissions(Long userId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now();
        List<TodayMissionItemResponse> missions = missionRepository.findAllByUserAndMissionDateOrderByIdAsc(
                        user,
                        today
                )
                .stream()
                .map(this::toTodayMissionItemResponse)
                .toList();

        return new TodayMissionResponse(today, missions);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private TodayMissionItemResponse toTodayMissionItemResponse(Mission mission) {
        return new TodayMissionItemResponse(
                mission.getId(),
                mission.getSlot(),
                mission.getTitle(),
                mission.getDescription(),
                mission.getMissionType(),
                mission.getStatus().name(),
                null
        );
    }
}
