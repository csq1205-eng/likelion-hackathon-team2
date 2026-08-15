package com.wedit.server.mission.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MissionGenerationScheduler {

    private final MissionService missionService;
    private final boolean enabled;

    public MissionGenerationScheduler(
            MissionService missionService,
            @Value("${app.mission.generation.enabled:false}") boolean enabled
    ) {
        this.missionService = missionService;
        this.enabled = enabled;
    }

    @Scheduled(
            cron = "${app.mission.generation.cron:0 0 5 * * *}",
            zone = "${app.mission.generation.zone:Asia/Seoul}"
    )
    public void generateTodayMissions() {
        if (!enabled) {
            return;
        }

        missionService.generateTodayMissionsForActiveUsers();
    }
}
