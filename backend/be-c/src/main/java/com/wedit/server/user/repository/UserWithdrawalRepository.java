package com.wedit.server.user.repository;

import com.wedit.server.user.domain.UserWithdrawal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserWithdrawalRepository extends JpaRepository<UserWithdrawal, Long> {
}
