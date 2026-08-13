package com.wedit.server.stamp.repository;

import com.wedit.server.group.domain.Group;
import com.wedit.server.stamp.domain.Stamp;
import com.wedit.server.stamp.domain.StampType;
import com.wedit.server.user.domain.User;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StampRepository extends JpaRepository<Stamp, Long> {

    Optional<Stamp> findByUserAndGroupAndStampTypeAndStampDate(
            User user,
            Group group,
            StampType stampType,
            LocalDate stampDate
    );

    Optional<Stamp> findByGroupAndStampTypeAndStampDate(
            Group group,
            StampType stampType,
            LocalDate stampDate
    );

    long countByGroupAndStampType(Group group, StampType stampType);

    long countByUserAndGroupAndStampType(User user, Group group, StampType stampType);

    @Query("""
            select count(stamp)
            from Stamp stamp
            where stamp.group = :group
              and stamp.stampType = :stampType
              and stamp.user is not null
            """)
    long countPersonalStampsByGroup(
            @Param("group") Group group,
            @Param("stampType") StampType stampType
    );
}
