package com.wedit.server.point.repository;

import com.wedit.server.point.domain.PointRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointRedemptionRepository extends JpaRepository<PointRedemption, Long> {
}
