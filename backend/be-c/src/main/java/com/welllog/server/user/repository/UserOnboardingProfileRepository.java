package com.welllog.server.user.repository;

import com.welllog.server.user.domain.User;
import com.welllog.server.user.domain.UserOnboardingProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOnboardingProfileRepository extends JpaRepository<UserOnboardingProfile, Long> {

    Optional<UserOnboardingProfile> findByUser(User user);
}
