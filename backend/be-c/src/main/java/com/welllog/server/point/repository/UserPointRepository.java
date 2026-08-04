package com.welllog.server.point.repository;

import com.welllog.server.point.domain.UserPoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPointRepository extends JpaRepository<UserPoint, Long> {
}
