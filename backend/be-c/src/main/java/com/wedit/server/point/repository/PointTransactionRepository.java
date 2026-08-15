package com.wedit.server.point.repository;

import com.wedit.server.point.domain.PointTransaction;
import com.wedit.server.user.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {

    List<PointTransaction> findTop10ByUserOrderByCreatedAtDesc(User user);

    boolean existsByUserAndReferenceTypeAndReferenceId(User user, String referenceType, Long referenceId);
}
