package com.wedit.server.user.repository;

import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserOnboardingProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOnboardingProfileRepository extends JpaRepository<UserOnboardingProfile, Long> {

    Optional<UserOnboardingProfile> findByUser(User user);
}
