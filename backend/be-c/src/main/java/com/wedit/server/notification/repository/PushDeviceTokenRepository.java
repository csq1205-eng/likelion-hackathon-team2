package com.wedit.server.notification.repository;

import com.wedit.server.notification.domain.PushDeviceToken;
import com.wedit.server.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushDeviceTokenRepository extends JpaRepository<PushDeviceToken, Long> {

    Optional<PushDeviceToken> findByUserAndDeviceToken(User user, String deviceToken);
}
