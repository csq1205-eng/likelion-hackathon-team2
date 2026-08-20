package com.wedit.server.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class ServiceTime {

    public static final ZoneId ZONE_ID = ZoneId.of("Asia/Seoul");

    private ServiceTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE_ID);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID);
    }
}
