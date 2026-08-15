package com.wedit.server.user.dto;

import java.time.LocalDate;

public record UserStreakResponse(
        Long userId,
        int currentStreakDays,
        int longestStreakDays,
        LocalDate lastCompletedDate
) {
}
