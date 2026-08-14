package com.wedit.server.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON-001", "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-001", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH-002", "접근 권한이 없습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER-001", "사용자를 찾을 수 없습니다."),
    ALREADY_WITHDRAWN_USER(HttpStatus.CONFLICT, "USER-002", "이미 탈퇴한 사용자입니다."),
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "GROUP-001", "그룹을 찾을 수 없습니다."),
    GROUP_ACCESS_DENIED(HttpStatus.FORBIDDEN, "GROUP-002", "그룹 접근 권한이 없습니다."),
    INVALID_GROUP_INVITE_CODE(HttpStatus.NOT_FOUND, "GROUP-003", "유효하지 않은 초대 코드입니다."),
    MISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "MISSION-001", "미션을 찾을 수 없습니다."),
    AI_INTEGRATION_FAILED(HttpStatus.BAD_GATEWAY, "AI-001", "AI 서비스 연동에 실패했습니다."),
    POINT_BALANCE_NOT_ENOUGH(HttpStatus.BAD_REQUEST, "POINT-001", "포인트 잔액이 부족합니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON-002", "요청한 리소스를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON-999", "서버 내부 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
