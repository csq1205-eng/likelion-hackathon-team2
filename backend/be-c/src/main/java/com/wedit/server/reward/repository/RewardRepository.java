package com.wedit.server.reward.repository;

import com.wedit.server.reward.domain.Reward;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    Optional<Reward> findFirstByActiveTrueOrderByIdAsc();
}
