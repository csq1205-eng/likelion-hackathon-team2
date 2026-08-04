"""
공통 오류 응답(기능명세서 5, 6번 섹션)을 위한 예외 계층.

BE B(clips API) 담당 오류 코드만 정의한다:
COMMON-001/002, MISSION-003/007, AI-001, FILE-002, CLIP-001/002/003.

다음은 의도적으로 제외했다:
- MISSION-001/002: 이 서비스에 미션 조회 로직이 생기기 전까지는 발생 지점이 없다.
- MISSION-004/005: 정책 함수(abuse_policy.py)는 있지만 아직 엔드포인트에 연결 전이다.
- MISSION-006: 담당이 BE A(미션 생성 단계)라 이 서비스 책임이 아니다.
이 코드들이 실제로 필요해지는 시점에 여기 추가한다.

INTERNAL-001은 스펙 코드표에 없는, BE 서비스 간 내부 인증 전용 코드다.

main.py의 exception_handler가 이 계층을 잡아 5번 섹션 envelope으로 변환한다.
"""
from typing import List, Optional


class WellLogError(Exception):
    """이 서비스가 클라이언트에 보내는 모든 비즈니스 오류의 공통 베이스."""

    code: str = "COMMON-001"
    http_status: int = 400

    def __init__(self, message: str, errors: Optional[List[dict]] = None):
        self.message = message
        self.errors = errors or []
        super().__init__(message)


class InvalidInputError(WellLogError):
    """COMMON-001: 입력값 검증 실패 (예: 빈 파일)"""
    code = "COMMON-001"
    http_status = 400


class InvalidCriteriaError(WellLogError):
    """COMMON-002: 지원하지 않는 요청 값 (criteria JSON 파싱/형식 오류)"""
    code = "COMMON-002"
    http_status = 400


class RetryLimitExceededError(WellLogError):
    """MISSION-003: FAIL 판정 3회로 재촬영 가능 횟수 소진"""
    code = "MISSION-003"
    http_status = 429


class TotalAttemptsExceededError(WellLogError):
    """MISSION-007(신규): HOLD 포함 전체 제출 시도 6회 초과.
    '재촬영 다 썼어요'(MISSION-003)와 '판정이 계속 애매해요'를 FE가
    다르게 안내해야 해서 별도 코드로 분리했다."""
    code = "MISSION-007"
    http_status = 429


class AIJudgementFailedError(WellLogError):
    """AI-001: AI 판정 요청 실패 (재시도 불가능한 처리 오류)"""
    code = "AI-001"
    http_status = 502


class InvalidFileFormatError(WellLogError):
    """FILE-001: 업로드 파일 형식 오류.
    확장자가 MP4/MOV 화이트리스트 밖이거나(main.py), 미션 인증 클립의
    영상 길이가 5초 기준 허용 범위를 벗어난 경우(frame_extraction.py) 둘 다 이 코드를 쓴다."""
    code = "FILE-001"
    http_status = 400


class FileTooLargeError(WellLogError):
    """FILE-002: 업로드 파일 크기 초과"""
    code = "FILE-002"
    http_status = 413


class ClipNotFoundError(WellLogError):
    """CLIP-001(신규): 클립 또는 클립 처리 이력을 찾을 수 없음.
    MISSION-001은 '미션' 조회 실패용이라 클립 조회 실패에는 맞지 않아 분리했다."""
    code = "CLIP-001"
    http_status = 404


class ClipAlreadyPurgedError(WellLogError):
    """CLIP-002(신규): 이미 파기된 클립"""
    code = "CLIP-002"
    http_status = 410


class ClipPurgeFailedError(WellLogError):
    """CLIP-003(신규): 클립 파기 처리 실패"""
    code = "CLIP-003"
    http_status = 500


class InvalidInternalKeyError(WellLogError):
    """INTERNAL-001(신규, 스펙 코드표 밖): 내부 서비스 인증 키가 유효하지 않음.
    사용자向 오류가 아니라 BE 서비스 간 호출 인증 전용."""
    code = "INTERNAL-001"
    http_status = 401
