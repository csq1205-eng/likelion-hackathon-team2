package com.welllog.server.user.repository;

import com.welllog.server.user.domain.User;
import com.welllog.server.user.domain.UserMissionPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMissionPreferenceRepository extends JpaRepository<UserMissionPreference, Long> {

    Optional<UserMissionPreference> findByUser(User user);
}
