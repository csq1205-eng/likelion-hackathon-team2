package com.wedit.server.point.repository;

import com.wedit.server.point.domain.UserPoint;
import com.wedit.server.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPointRepository extends JpaRepository<UserPoint, Long> {

    Optional<UserPoint> findByUser(User user);
}
