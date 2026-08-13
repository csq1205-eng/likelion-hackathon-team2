package com.wedit.server.mission.repository;

import com.wedit.server.mission.domain.Mission;
import com.wedit.server.user.domain.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findAllByUserAndMissionDateOrderByIdAsc(User user, LocalDate missionDate);
}
