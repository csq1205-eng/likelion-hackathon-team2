package com.wedit.server.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedit.server.auth.repository.UserSessionRepository;
import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.GroupMember;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserStatus;
import com.wedit.server.user.domain.UserWithdrawal;
import com.wedit.server.user.dto.UserWithdrawalRequest;
import com.wedit.server.user.dto.UserWithdrawalResponse;
import com.wedit.server.user.dto.WithdrawalCleanupRequest;
import com.wedit.server.user.dto.WithdrawalCleanupResponse;
import com.wedit.server.user.repository.UserRepository;
import com.wedit.server.user.repository.UserWithdrawalRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserWithdrawalService {

    private static final String CLEANUP_COMPLETED = "COMPLETED";
    private static final String CLEANUP_NO_CLIPS = "NO_CLIPS";
    private static final String CLEANUP_PROCESSING = "PROCESSING";

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserWithdrawalRepository userWithdrawalRepository;
    private final WithdrawalCleanupClient withdrawalCleanupClient;
    private final ObjectMapper objectMapper;

    public UserWithdrawalService(
            UserRepository userRepository,
            UserSessionRepository userSessionRepository,
            GroupMemberRepository groupMemberRepository,
            UserWithdrawalRepository userWithdrawalRepository,
            WithdrawalCleanupClient withdrawalCleanupClient,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userWithdrawalRepository = userWithdrawalRepository;
        this.withdrawalCleanupClient = withdrawalCleanupClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UserWithdrawalResponse withdraw(Long userId, UserWithdrawalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() == UserStatus.WITHDRAWN) {
            throw new CustomException(ErrorCode.ALREADY_WITHDRAWN_USER);
        }

        UserWithdrawal withdrawal = userWithdrawalRepository.save(UserWithdrawal.create(user, request.reason()));
        WithdrawalCleanupResponse cleanupResponse = withdrawalCleanupClient.cleanup(new WithdrawalCleanupRequest(
                user.getId(),
                withdrawal.getId(),
                LocalDateTime.now()
        ));
        String deletedScope = toDeletedScope(cleanupResponse);
        if (CLEANUP_PROCESSING.equals(cleanupResponse.cleanupStatus())) {
            withdrawal.markProcessing(deletedScope);
            return toResponse(user, withdrawal);
        }
        if (!isCleanupCompleted(cleanupResponse)) {
            withdrawal.fail(deletedScope);
            return toResponse(user, withdrawal);
        }

        groupMemberRepository.findAllByUserAndStatus(user, GroupMemberStatus.ACTIVE)
                .forEach(GroupMember::leave);
        userSessionRepository.deleteAllByUser(user);
        user.withdraw();
        withdrawal.complete(deletedScope);

        return toResponse(user, withdrawal);
    }

    private boolean isCleanupCompleted(WithdrawalCleanupResponse cleanupResponse) {
        return CLEANUP_COMPLETED.equals(cleanupResponse.cleanupStatus())
                || CLEANUP_NO_CLIPS.equals(cleanupResponse.cleanupStatus());
    }

    private UserWithdrawalResponse toResponse(User user, UserWithdrawal withdrawal) {
        return new UserWithdrawalResponse(
                user.getId(),
                withdrawal.getId(),
                withdrawal.getStatus().name()
        );
    }

    private String toDeletedScope(WithdrawalCleanupResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException exception) {
            throw new CustomException(ErrorCode.AI_INTEGRATION_FAILED, "BE B 탈퇴 클립 정리 결과 변환에 실패했습니다.");
        }
    }
}
