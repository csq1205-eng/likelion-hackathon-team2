package com.wedit.server.user.repository;

import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

    Optional<UserConsent> findByUser(User user);
}
