package com.wedit.server.user.repository;

import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);

    boolean existsBySocialProviderAndSocialId(SocialProvider socialProvider, String socialId);
}
