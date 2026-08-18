package com.wedit.server.reward.repository;

import com.wedit.server.group.domain.Group;
import com.wedit.server.reward.domain.RewardGrant;
import com.wedit.server.user.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardGrantRepository extends JpaRepository<RewardGrant, Long> {

    Optional<RewardGrant> findByUserAndGroup(User user, Group group);

    List<RewardGrant> findAllByUserOrderByGrantedAtDesc(User user);
}
