package com.wedit.server.auth.repository;

import com.wedit.server.auth.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
}
