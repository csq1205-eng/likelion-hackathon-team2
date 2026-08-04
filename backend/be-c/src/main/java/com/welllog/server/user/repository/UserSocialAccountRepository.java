package com.welllog.server.user.repository;

import com.welllog.server.user.domain.SocialProvider;
import com.welllog.server.user.domain.UserSocialAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {

    Optional<UserSocialAccount> findByProviderAndProviderUserId(
            SocialProvider provider,
            String providerUserId
    );
}
