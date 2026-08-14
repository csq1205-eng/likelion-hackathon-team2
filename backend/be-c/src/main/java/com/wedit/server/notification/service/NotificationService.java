package com.wedit.server.notification.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.notification.domain.Notification;
import com.wedit.server.notification.domain.PushDeviceToken;
import com.wedit.server.notification.dto.NotificationItemResponse;
import com.wedit.server.notification.dto.NotificationListResponse;
import com.wedit.server.notification.dto.NotificationReadResponse;
import com.wedit.server.notification.dto.PushTokenRequest;
import com.wedit.server.notification.dto.PushTokenResponse;
import com.wedit.server.notification.repository.NotificationRepository;
import com.wedit.server.notification.repository.PushDeviceTokenRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final UserRepository userRepository;
    private final PushDeviceTokenRepository pushDeviceTokenRepository;
    private final NotificationRepository notificationRepository;

    public NotificationService(
            UserRepository userRepository,
            PushDeviceTokenRepository pushDeviceTokenRepository,
            NotificationRepository notificationRepository
    ) {
        this.userRepository = userRepository;
        this.pushDeviceTokenRepository = pushDeviceTokenRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public PushTokenResponse registerPushToken(Long userId, PushTokenRequest request) {
        User user = findUser(userId);
        PushDeviceToken pushDeviceToken = pushDeviceTokenRepository.findByUserAndDeviceToken(user, request.deviceToken())
                .orElseGet(() -> PushDeviceToken.create(
                        user,
                        request.deviceToken(),
                        request.platform(),
                        request.deviceId()
                ));
        pushDeviceToken.update(request.deviceToken(), request.platform(), request.deviceId());
        PushDeviceToken savedToken = pushDeviceTokenRepository.save(pushDeviceToken);

        return new PushTokenResponse(
                savedToken.getId(),
                savedToken.getUser().getId(),
                savedToken.getPlatform(),
                savedToken.isActive()
        );
    }

    @Transactional(readOnly = true)
    public NotificationListResponse getNotifications(Long userId) {
        User user = findUser(userId);

        return new NotificationListResponse(notificationRepository.findAllByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toNotificationItemResponse)
                .toList());
    }

    @Transactional
    public NotificationReadResponse readNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        notification.read();

        return new NotificationReadResponse(notification.getId(), notification.isRead());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private NotificationItemResponse toNotificationItemResponse(Notification notification) {
        return new NotificationItemResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getBody(),
                notification.getNotificationType(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
