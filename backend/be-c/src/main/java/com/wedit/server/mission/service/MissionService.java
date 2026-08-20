package com.wedit.server.mission.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.highlight.service.HighlightGenerationTriggerService;
import com.wedit.server.mission.domain.Mission;
import com.wedit.server.mission.domain.MissionResult;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.mission.dto.AiMissionEnvironmentRequest;
import com.wedit.server.mission.dto.AiMissionGenerateRequest;
import com.wedit.server.mission.dto.AiMissionGenerateResponse;
import com.wedit.server.mission.dto.AiMissionItemResponse;
import com.wedit.server.mission.dto.AiMissionProfileRequest;
import com.wedit.server.mission.dto.MissionGenerationResponse;
import com.wedit.server.mission.dto.MissionResultCreateRequest;
import com.wedit.server.mission.dto.MissionResultCreateResponse;
import com.wedit.server.mission.dto.TodayMissionItemResponse;
import com.wedit.server.mission.dto.TodayMissionResponse;
import com.wedit.server.mission.repository.MissionRepository;
import com.wedit.server.mission.repository.MissionResultRepository;
import com.wedit.server.point.service.PointService;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserMissionPreference;
import com.wedit.server.user.domain.UserOnboardingProfile;
import com.wedit.server.user.domain.UserStatus;
import com.wedit.server.user.repository.UserMissionPreferenceRepository;
import com.wedit.server.user.repository.UserOnboardingProfileRepository;
import com.wedit.server.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MissionService {

    private static final String DEFAULT_GOAL = "건강한 생활 습관 만들기";
    private static final String DEFAULT_SKIN_TYPE = "normal";
    private static final int MAX_DAILY_MISSION_COUNT = 3;

    private final UserRepository userRepository;
    private final UserOnboardingProfileRepository userOnboardingProfileRepository;
    private final UserMissionPreferenceRepository userMissionPreferenceRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MissionRepository missionRepository;
    private final MissionResultRepository missionResultRepository;
    private final MissionGenerationClient missionGenerationClient;
    private final HighlightGenerationTriggerService highlightGenerationTriggerService;
    private final PointService pointService;
    private final ObjectMapper objectMapper;

    public MissionService(
            UserRepository userRepository,
            UserOnboardingProfileRepository userOnboardingProfileRepository,
            UserMissionPreferenceRepository userMissionPreferenceRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            MissionRepository missionRepository,
            MissionResultRepository missionResultRepository,
            MissionGenerationClient missionGenerationClient,
            HighlightGenerationTriggerService highlightGenerationTriggerService,
            PointService pointService,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.userOnboardingProfileRepository = userOnboardingProfileRepository;
        this.userMissionPreferenceRepository = userMissionPreferenceRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.missionRepository = missionRepository;
        this.missionResultRepository = missionResultRepository;
        this.missionGenerationClient = missionGenerationClient;
        this.highlightGenerationTriggerService = highlightGenerationTriggerService;
        this.pointService = pointService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public TodayMissionResponse getTodayMissions(Long userId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now();
        Group missionGroup = findDefaultMissionGroup(user);
        Long missionGroupId = missionGroup == null ? null : missionGroup.getId();
        List<TodayMissionItemResponse> missions = missionRepository.findAllByUserAndMissionDateAndGroupIdOrderByIdAsc(
                        user,
                        today,
                        missionGroupId
                )
                .stream()
                .limit(MAX_DAILY_MISSION_COUNT)
                .map(this::toTodayMissionItemResponse)
                .toList();

        return new TodayMissionResponse(today, missions);
    }

    @Transactional
    public List<MissionGenerationResponse> generateTodayMissions(Long userId, Long groupId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now();
        List<Group> targetGroups = findTargetGroups(user, groupId);

        return targetGroups.stream()
                .map(group -> saveGeneratedMissions(user, group, today))
                .toList();
    }

    @Transactional
    public List<MissionGenerationResponse> generateTodayMissionsForActiveUsers() {
        List<MissionGenerationResponse> responses = new ArrayList<>();
        for (User user : userRepository.findAllByStatus(UserStatus.ACTIVE)) {
            responses.addAll(generateTodayMissions(user.getId(), null));
        }

        return responses;
    }

    @Transactional
    public MissionResultCreateResponse saveMissionResult(MissionResultCreateRequest request) {
        Mission mission = missionRepository.findById(request.missionId())
                .orElseThrow(() -> new CustomException(ErrorCode.MISSION_NOT_FOUND));
        MissionResultType result = toMissionResultType(request.result());
        LocalDateTime judgedAt = request.judgedAt() == null ? LocalDateTime.now() : request.judgedAt();
        String promptVersion = request.promptVersion() == null ? "mission-judge-prompt-v1" : request.promptVersion();
        String modelVersion = request.modelVersion() == null ? "wedit-judge-v1" : request.modelVersion();

        MissionResult missionResult = missionResultRepository.save(MissionResult.create(
                mission,
                request.clipId(),
                mission.getUser(),
                result,
                request.reason(),
                request.confidenceScore(),
                promptVersion,
                modelVersion,
                judgedAt
        ));
        mission.applyResult(result);
        if (result == MissionResultType.PASS) {
            pointService.earnMissionPassPoint(mission.getUser(), mission.getId());
            highlightGenerationTriggerService.generateIfGroupMissionCompleted(mission);
        }

        return new MissionResultCreateResponse(
                missionResult.getId(),
                mission.getId(),
                request.clipId(),
                mission.getUser().getId(),
                result.name()
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private List<Group> findTargetGroups(User user, Long groupId) {
        if (groupId != null) {
            Group group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
            if (!groupMemberRepository.existsByGroupAndUserAndStatus(group, user, GroupMemberStatus.ACTIVE)) {
                throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
            }

            return List.of(group);
        }

        return Collections.singletonList(findDefaultMissionGroup(user));
    }

    private Group findDefaultMissionGroup(User user) {
        return groupMemberRepository.findAllByUserAndStatusOrderByIdAsc(user, GroupMemberStatus.ACTIVE)
                .stream()
                .map(GroupMember::getGroup)
                .findFirst()
                .orElse(null);
    }

    private MissionGenerationResponse saveGeneratedMissions(
            User user,
            Group group,
            LocalDate missionDate
    ) {
        Long groupId = group == null ? null : group.getId();
        List<Mission> existingMissions = missionRepository.findAllByUserAndMissionDateAndGroupIdOrderByIdAsc(
                user,
                missionDate,
                groupId
        );
        if (!existingMissions.isEmpty()) {
            return new MissionGenerationResponse(
                    user.getId(),
                    groupId,
                    missionDate,
                    0,
                    existingMissions.stream().map(Mission::getId).toList()
            );
        }

        AiMissionGenerateResponse aiResponse = missionGenerationClient.generate(toAiMissionGenerateRequest(user, group));
        if (aiResponse == null || aiResponse.missions() == null) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 미션 생성 응답이 비어 있습니다.");
        }

        List<Mission> missions = aiResponse.missions()
                .stream()
                .map(item -> toMission(user, group, missionDate, item))
                .map(missionRepository::save)
                .toList();

        return new MissionGenerationResponse(
                user.getId(),
                groupId,
                missionDate,
                missions.size(),
                missions.stream().map(Mission::getId).toList()
        );
    }

    private AiMissionGenerateRequest toAiMissionGenerateRequest(User user, Group group) {
        Optional<UserOnboardingProfile> profile = userOnboardingProfileRepository.findByUser(user);
        Optional<UserMissionPreference> preference = userMissionPreferenceRepository.findByUser(user);
        List<String> concerns = profile
                .map(this::toConcerns)
                .filter(concernList -> !concernList.isEmpty())
                .orElseGet(() -> List.of(DEFAULT_GOAL));
        List<String> excludedMissions = preference
                .map(UserMissionPreference::getExcludedKeywords)
                .orElseGet(List::of);

        return new AiMissionGenerateRequest(
                user.getId(),
                group == null ? DEFAULT_GOAL : group.getGoalName(),
                new AiMissionProfileRequest(
                        DEFAULT_SKIN_TYPE,
                        concerns,
                        profile.map(UserOnboardingProfile::getSleepHours)
                                .map(BigDecimal::doubleValue)
                                .orElse(null),
                        preference.map(UserMissionPreference::getPreferredMissionTypes)
                                .orElseGet(List::of),
                        preference.map(UserMissionPreference::getAvoidedMissionTypes)
                                .orElseGet(List::of)
                ),
                new AiMissionEnvironmentRequest(null, null, null, null),
                excludedMissions,
                MAX_DAILY_MISSION_COUNT
        );
    }

    private List<String> toConcerns(UserOnboardingProfile profile) {
        List<String> concerns = new ArrayList<>();
        if (profile.getMainConcern() != null && !profile.getMainConcern().isBlank()) {
            concerns.add(profile.getMainConcern());
        }
        if (profile.getCauseCandidates() != null) {
            concerns.addAll(profile.getCauseCandidates());
        }

        return concerns;
    }

    private Mission toMission(User user, Group group, LocalDate missionDate, AiMissionItemResponse item) {
        return Mission.create(
                user,
                group,
                missionDate,
                item.slot(),
                item.title(),
                item.description(),
                item.missionType(),
                toVerificationCriteriaJson(item),
                item.reason()
        );
    }

    private String toVerificationCriteriaJson(AiMissionItemResponse item) {
        try {
            return objectMapper.writeValueAsString(item.verificationCriteria());
        } catch (JsonProcessingException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE A 미션 검증 기준 변환에 실패했습니다.");
        }
    }

    private MissionResultType toMissionResultType(String result) {
        try {
            return MissionResultType.valueOf(result);
        } catch (IllegalArgumentException exception) {
            throw new CustomException(ErrorCode.INVALID_INPUT, "미션 판정 결과는 PASS, FAIL, HOLD, ERROR 중 하나여야 합니다.");
        }
    }

    private TodayMissionItemResponse toTodayMissionItemResponse(Mission mission) {
        return new TodayMissionItemResponse(
                mission.getId(),
                mission.getSlot(),
                mission.getTitle(),
                mission.getDescription(),
                mission.getMissionType(),
                mission.getVerificationCriteria(),
                mission.getStatus().name(),
                mission.getReason()
        );
    }
}
