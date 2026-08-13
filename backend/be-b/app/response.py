from typing import Any, Optional

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def _serialize(data: Any) -> Any:
    to_payload = getattr(data, "to_payload", None)
    if callable(to_payload):
        return to_payload()
    return jsonable_encoder(data)


def success(data: Any = None, message: Optional[str] = None, status_code: int = 200) -> JSONResponse:
    """명세서 4장의 공통 성공 응답 {success, data, message} 형태로 감싼다."""
    payload = {"success": True, "data": _serialize(data), "message": message}
    return JSONResponse(status_code=status_code, content=payload)


def failure(data: Any = None, message: Optional[str] = None, status_code: int = 500) -> JSONResponse:
    """success=false 형태의 응답 (예: 16.4 withdrawal-cleanup 500 응답)."""
    payload = {"success": False, "data": _serialize(data), "message": message}
    return JSONResponse(status_code=status_code, content=payload)
