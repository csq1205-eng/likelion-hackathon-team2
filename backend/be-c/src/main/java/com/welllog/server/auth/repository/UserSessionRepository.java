package com.welllog.server.auth.repository;

import com.welllog.server.auth.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
}
