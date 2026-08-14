package com.wedit.server.mission.repository;

import com.wedit.server.group.domain.Group;
import com.wedit.server.mission.domain.MissionResult;
import com.wedit.server.mission.domain.MissionResultType;
import com.wedit.server.user.domain.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionResultRepository extends JpaRepository<MissionResult, Long> {

    @Query("""
            select count(distinct missionResult.mission.id)
            from MissionResult missionResult
            where missionResult.mission.group = :group
              and missionResult.mission.user = :user
              and missionResult.mission.missionDate = :missionDate
              and missionResult.result = :result
            """)
    long countPassedMissions(
            @Param("group") Group group,
            @Param("user") User user,
            @Param("missionDate") LocalDate missionDate,
            @Param("result") MissionResultType result
    );

    @Query("""
            select missionResult.mission.missionDate
            from MissionResult missionResult
            where missionResult.user = :user
              and missionResult.result = :result
            group by missionResult.mission.missionDate
            having count(distinct missionResult.mission.id) >= :requiredCount
            order by missionResult.mission.missionDate desc
            """)
    List<LocalDate> findCompletedDates(
            @Param("user") User user,
            @Param("result") MissionResultType result,
            @Param("requiredCount") long requiredCount
    );

    @Query("""
            select missionResult.mission.id
            from MissionResult missionResult
            where missionResult.user = :user
              and missionResult.result = :result
              and missionResult.mission.missionDate between :startDate and :endDate
            group by missionResult.mission.id
            """)
    List<Long> findPassedMissionIds(
            @Param("user") User user,
            @Param("result") MissionResultType result,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
