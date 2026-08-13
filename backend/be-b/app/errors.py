from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True)
class ErrorCode:
    http_status: int
    code: str
    message: str


# 명세서 6장 "공통 오류 코드" 중 BE B가 실제로 발생시키는 코드.
AUTH_001_TOKEN_MISSING = ErrorCode(401, "AUTH-001", "인증 토큰이 없습니다.")
AUTH_002_TOKEN_INVALID = ErrorCode(401, "AUTH-002", "인증 토큰이 만료되었거나 유효하지 않습니다.")
MISSION_003_RETRY_EXCEEDED = ErrorCode(429, "MISSION-003", "재촬영 가능 횟수를 초과했습니다.")
MISSION_004_INVALID_TIME_WINDOW = ErrorCode(400, "MISSION-004", "미션 유효 시간대가 아닙니다.")
MISSION_005_DAILY_LIMIT_EXCEEDED = ErrorCode(400, "MISSION-005", "일일 AI 판정 호출 횟수를 초과했습니다.")
AI_001_JUDGEMENT_FAILED = ErrorCode(502, "AI-001", "AI 판정 요청에 실패했습니다.")
FILE_001_INVALID_TYPE = ErrorCode(400, "FILE-001", "업로드 파일 형식이 올바르지 않습니다.")
FILE_002_TOO_LARGE = ErrorCode(413, "FILE-002", "업로드 파일 크기가 허용 범위를 초과했습니다.")

# 명세서 6장에는 "클립을 찾을 수 없음"에 대응하는 코드가 없다. mission_clips가
# 미션 하위 리소스인 점을 고려해 BE B 자체 코드로 CLIP-001을 추가한다.
# (README "확인 필요" 참고 — 팀 스펙 문서에 정식으로 추가할지 협의 필요)
CLIP_001_NOT_FOUND = ErrorCode(404, "CLIP-001", "클립을 찾을 수 없습니다.")

COMMON_001_INVALID_INPUT = ErrorCode(400, "COMMON-001", "입력값이 올바르지 않습니다.")


@dataclass
class FieldErrorDetail:
    field: str
    value: object
    reason: str


class ApiException(Exception):
    """명세서 5장의 공통 오류 응답 형식으로 변환되는 예외."""

    def __init__(self, error_code: ErrorCode, message: Optional[str] = None,
                 errors: Optional[List[FieldErrorDetail]] = None):
        self.error_code = error_code
        self.message = message or error_code.message
        self.errors = errors or []
        super().__init__(self.message)
