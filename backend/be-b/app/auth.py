from fastapi import Header

from app.config import settings
from app.errors import AUTH_001_TOKEN_MISSING, AUTH_002_TOKEN_INVALID, ApiException

_BEARER_PREFIX = "Bearer "
_TEMPORARY_TOKEN_PREFIX = "temporary-token-"


def resolve_user_id(authorization: str | None = Header(default=None)) -> int:
    """Authorization 헤더에서 사용자 ID를 뽑아낸다.

    BE C(AuthService)가 MVP 단계에서 발급하는 액세스 토큰은 실제 JWT가 아니라
    "temporary-token-{userId}" 형태다 (TemporaryAccessTokenResolver.java 참고).
    BE B는 별도 세션 저장소가 없어 같은 형식을 그대로 신뢰해 사용자를 식별한다.
    """
    if not authorization:
        raise ApiException(AUTH_001_TOKEN_MISSING)

    if not authorization.startswith(_BEARER_PREFIX):
        raise ApiException(AUTH_002_TOKEN_INVALID)

    token = authorization[len(_BEARER_PREFIX):].strip()
    if not token.startswith(_TEMPORARY_TOKEN_PREFIX):
        raise ApiException(AUTH_002_TOKEN_INVALID)

    try:
        return int(token[len(_TEMPORARY_TOKEN_PREFIX):])
    except ValueError:
        raise ApiException(AUTH_002_TOKEN_INVALID)


def verify_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    """서버 간 내부 호출(highlight-complete, withdrawal-cleanup) 인증.

    INTERNAL_API_KEY가 설정되지 않은 로컬 개발 환경에서는 검증을 생략한다.
    """
    expected = settings.internal_api_key
    if not expected:
        return
    if x_internal_key != expected:
        raise ApiException(AUTH_002_TOKEN_INVALID, message="내부 API 키가 올바르지 않습니다.")
