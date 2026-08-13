package com.wedit.server.group.dto;

public record PersonalStampResponse(
        Long userId,
        String nickname,
        Long stampId,
        boolean newlyIssued
) {
}
