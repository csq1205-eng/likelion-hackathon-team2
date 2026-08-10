package com.wedit.server.user.repository;

import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserMissionPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMissionPreferenceRepository extends JpaRepository<UserMissionPreference, Long> {

    Optional<UserMissionPreference> findByUser(User user);
}
