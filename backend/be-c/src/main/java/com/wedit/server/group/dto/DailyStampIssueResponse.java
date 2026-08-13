package com.wedit.server.group.dto;

import java.time.LocalDate;
import java.util.List;

public record DailyStampIssueResponse(
        Long groupId,
        LocalDate date,
        int memberCount,
        int completedMemberCount,
        int personalStampCount,
        boolean groupStampIssued,
        Long groupStampId,
        List<PersonalStampResponse> personalStamps
) {
}
