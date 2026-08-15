package com.wedit.server.user.repository;

import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);

    boolean existsBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);

    List<User> findAllByStatus(UserStatus status);
}
