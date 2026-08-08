package com.welllog.server.user.repository;

import com.welllog.server.user.domain.SocialProvider;
import com.welllog.server.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);

    boolean existsBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);
}
