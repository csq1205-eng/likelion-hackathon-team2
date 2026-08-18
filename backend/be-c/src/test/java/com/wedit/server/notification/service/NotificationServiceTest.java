package com.wedit.server.notification.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.notification.dto.NotificationCreateRequest;
import com.wedit.server.notification.dto.NotificationCreateResponse;
import com.wedit.server.notification.dto.NotificationListResponse;
import com.wedit.server.notification.repository.NotificationRepository;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("푸시 발송 대상 알림 이력을 생성하고 목록에서 조회한다")
    void createNotification() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-notification-user",
                "notification@example.com",
                "정효림",
                null
        ));

        NotificationCreateResponse created = notificationService.createNotification(
                user.getId(),
                new NotificationCreateRequest("미션 완료", "그룹원이 오늘 미션을 완료했어요.", "GROUP_MISSION_DONE")
        );
        NotificationListResponse list = notificationService.getNotifications(user.getId());

        assertThat(created.notificationId()).isNotNull();
        assertThat(created.userId()).isEqualTo(user.getId());
        assertThat(created.read()).isFalse();
        assertThat(list.items()).hasSize(1);
        assertThat(notificationRepository.count()).isEqualTo(1);
    }
}
