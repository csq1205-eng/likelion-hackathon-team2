package com.wedit.server.notification.repository;

import com.wedit.server.notification.domain.Notification;
import com.wedit.server.user.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByUserOrderByCreatedAtDesc(User user);
}
