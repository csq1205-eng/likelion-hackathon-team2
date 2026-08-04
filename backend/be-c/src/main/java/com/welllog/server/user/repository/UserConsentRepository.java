package com.welllog.server.user.repository;

import com.welllog.server.user.domain.User;
import com.welllog.server.user.domain.UserConsent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

    Optional<UserConsent> findByUser(User user);
}
