package com.wedit.server.point.repository;

import com.wedit.server.point.domain.UserPoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPointRepository extends JpaRepository<UserPoint, Long> {
}
