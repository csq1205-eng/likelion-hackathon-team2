package com.wedit.server.user.repository;

import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.UserSocialAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {

    Optional<UserSocialAccount> findByProviderAndProviderUserId(
            SocialProvider provider,
            String providerUserId
    );
}
