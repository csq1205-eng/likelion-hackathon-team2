package com.wedit.server.reward.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.reward.domain.RewardGrant;
import com.wedit.server.reward.dto.RewardGrantItemResponse;
import com.wedit.server.reward.dto.RewardGrantListResponse;
import com.wedit.server.reward.repository.RewardGrantRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RewardService {

    private final UserRepository userRepository;
    private final RewardGrantRepository rewardGrantRepository;

    public RewardService(
            UserRepository userRepository,
            RewardGrantRepository rewardGrantRepository
    ) {
        this.userRepository = userRepository;
        this.rewardGrantRepository = rewardGrantRepository;
    }

    @Transactional(readOnly = true)
    public RewardGrantListResponse getRewardGrants(Long userId) {
        User user = findUser(userId);

        return new RewardGrantListResponse(
                user.getId(),
                rewardGrantRepository.findAllByUserOrderByGrantedAtDesc(user)
                        .stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private RewardGrantItemResponse toResponse(RewardGrant rewardGrant) {
        return new RewardGrantItemResponse(
                rewardGrant.getId(),
                rewardGrant.getReward().getId(),
                rewardGrant.getGroup() == null ? null : rewardGrant.getGroup().getId(),
                rewardGrant.getReward().getName(),
                rewardGrant.getReward().getRewardType().name(),
                rewardGrant.getStatus().name(),
                rewardGrant.getGrantedAt()
        );
    }
}
