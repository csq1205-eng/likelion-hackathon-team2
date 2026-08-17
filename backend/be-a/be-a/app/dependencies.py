import hmac
import os
from typing import Optional

from fastapi import Header, HTTPException, status


def require_internal_key(
    x_internal_key: Optional[str] = Header(default=None),
) -> None:
    """운영 키가 설정된 경우에만 내부 API 인증을 강제한다.

    로컬 테스트에서는 INTERNAL_API_KEY를 비워 기존 개발 흐름을 유지할 수 있다.
    """
    expected_key = os.getenv("INTERNAL_API_KEY", "").strip()
    if not expected_key:
        return
    if not x_internal_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Internal-Key 헤더가 필요합니다.",
        )
    if not hmac.compare_digest(x_internal_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="유효하지 않은 내부 인증 키입니다.",
        )
