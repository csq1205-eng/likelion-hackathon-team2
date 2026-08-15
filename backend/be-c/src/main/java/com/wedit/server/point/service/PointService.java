package com.wedit.server.point.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.point.domain.PointRedemption;
import com.wedit.server.point.domain.PointTransaction;
import com.wedit.server.point.domain.UserPoint;
import com.wedit.server.point.dto.PointRedeemRequest;
import com.wedit.server.point.dto.PointRedeemResponse;
import com.wedit.server.point.dto.PointResponse;
import com.wedit.server.point.dto.PointTransactionResponse;
import com.wedit.server.point.repository.PointRedemptionRepository;
import com.wedit.server.point.repository.PointTransactionRepository;
import com.wedit.server.point.repository.UserPointRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PointService {

    private static final int MISSION_PASS_POINT = 100;
    private static final String MISSION_REFERENCE_TYPE = "MISSION";

    private final UserRepository userRepository;
    private final UserPointRepository userPointRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final PointRedemptionRepository pointRedemptionRepository;

    public PointService(
            UserRepository userRepository,
            UserPointRepository userPointRepository,
            PointTransactionRepository pointTransactionRepository,
            PointRedemptionRepository pointRedemptionRepository
    ) {
        this.userRepository = userRepository;
        this.userPointRepository = userPointRepository;
        this.pointTransactionRepository = pointTransactionRepository;
        this.pointRedemptionRepository = pointRedemptionRepository;
    }

    @Transactional(readOnly = true)
    public PointResponse getPoints(Long userId) {
        User user = findUser(userId);
        UserPoint userPoint = findOrCreatePointForRead(user);

        return new PointResponse(
                user.getId(),
                userPoint.getBalance(),
                userPoint.getTotalEarned(),
                userPoint.getTotalUsed(),
                pointTransactionRepository.findTop10ByUserOrderByCreatedAtDesc(user)
                        .stream()
                        .map(this::toPointTransactionResponse)
                        .toList()
        );
    }

    @Transactional
    public PointRedeemResponse redeem(Long userId, PointRedeemRequest request) {
        User user = findUser(userId);
        UserPoint userPoint = findOrCreatePoint(user);
        if (userPoint.getBalance() < request.pointAmount()) {
            throw new CustomException(ErrorCode.POINT_BALANCE_NOT_ENOUGH);
        }

        PointRedemption redemption = pointRedemptionRepository.save(PointRedemption.create(
                user,
                request.redemptionType(),
                request.pointAmount()
        ));
        userPoint.use(request.pointAmount());
        pointTransactionRepository.save(PointTransaction.use(
                user,
                request.pointAmount(),
                userPoint.getBalance(),
                "포인트 전환",
                "POINT_REDEMPTION",
                redemption.getId()
        ));

        return new PointRedeemResponse(
                redemption.getId(),
                redemption.getRedemptionType(),
                redemption.getPointAmount(),
                redemption.getStatus().name(),
                userPoint.getBalance()
        );
    }

    @Transactional
    public void earnMissionPassPoint(User user, Long missionId) {
        if (pointTransactionRepository.existsByUserAndReferenceTypeAndReferenceId(
                user,
                MISSION_REFERENCE_TYPE,
                missionId
        )) {
            return;
        }

        UserPoint userPoint = findOrCreatePoint(user);
        userPoint.earn(MISSION_PASS_POINT);
        pointTransactionRepository.save(PointTransaction.earn(
                user,
                MISSION_PASS_POINT,
                userPoint.getBalance(),
                "미션 판정 통과",
                MISSION_REFERENCE_TYPE,
                missionId
        ));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private UserPoint findOrCreatePoint(User user) {
        return userPointRepository.findByUser(user)
                .orElseGet(() -> userPointRepository.save(UserPoint.create(user)));
    }

    private UserPoint findOrCreatePointForRead(User user) {
        return userPointRepository.findByUser(user)
                .orElseGet(() -> UserPoint.create(user));
    }

    private PointTransactionResponse toPointTransactionResponse(PointTransaction transaction) {
        return new PointTransactionResponse(
                transaction.getId(),
                transaction.getTransactionType().name(),
                transaction.getAmount(),
                transaction.getReason(),
                transaction.getCreatedAt()
        );
    }
}
