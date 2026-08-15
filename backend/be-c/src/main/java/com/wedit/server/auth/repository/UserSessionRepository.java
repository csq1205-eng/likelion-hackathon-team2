package com.wedit.server.auth.repository;

import com.wedit.server.auth.domain.UserSession;
import com.wedit.server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    void deleteAllByUser(User user);
}
