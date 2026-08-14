package com.wedit.server.mission.repository;

import com.wedit.server.mission.domain.Mission;
import com.wedit.server.user.domain.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findAllByUserAndMissionDateOrderByIdAsc(User user, LocalDate missionDate);

    List<Mission> findAllByUserAndMissionDateBetweenOrderByMissionDateAscIdAsc(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
            select mission
            from Mission mission
            where mission.user = :user
              and mission.missionDate = :missionDate
              and (
                    (:groupId is null and mission.group is null)
                    or mission.group.id = :groupId
                  )
            order by mission.id asc
            """)
    List<Mission> findAllByUserAndMissionDateAndGroupIdOrderByIdAsc(
            @Param("user") User user,
            @Param("missionDate") LocalDate missionDate,
            @Param("groupId") Long groupId
    );
}
