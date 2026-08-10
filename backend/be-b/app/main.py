import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import db_session, init_db
from app.errors import COMMON_001_INVALID_INPUT, ApiException
from app.routers.clips import router as clips_router
from app.routers.internal import router as internal_router
from app.services.retention_service import purge_expired_shared_clips

logger = logging.getLogger(__name__)

_RETENTION_SWEEP_INTERVAL_SEC = 300


async def _retention_sweep_loop() -> None:
    while True:
        await asyncio.sleep(_RETENTION_SWEEP_INTERVAL_SEC)
        try:
            with db_session() as conn:
                purged = purge_expired_shared_clips(conn)
            if purged:
                logger.info("retention sweep purged %s expired shared clip(s)", purged)
        except Exception:
            logger.exception("retention sweep failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    init_db()
    sweep_task = asyncio.create_task(_retention_sweep_loop())
    try:
        yield
    finally:
        sweep_task.cancel()


app = FastAPI(
    title="WEDIT BE B",
    description="미션 인증 클립 업로드, 프레임 추출, AI 비전 판정, 보관/파기 정책을 담당하는 서비스",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clips_router)
app.include_router(internal_router)


# StaticFiles는 마운트 시점에 디렉터리가 이미 있어야 하므로 lifespan을 기다리지 않고 미리 만든다.
settings.storage_root.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=settings.storage_root), name="files")


def _error_body(status: int, code: str, message: str, errors: list, path: str) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "code": code,
        "message": message,
        "errors": errors,
        "path": path,
    }


@app.exception_handler(ApiException)
def handle_api_exception(request: Request, exc: ApiException) -> JSONResponse:
    body = _error_body(
        status=exc.error_code.http_status,
        code=exc.error_code.code,
        message=exc.message,
        errors=[e.__dict__ for e in exc.errors],
        path=request.url.path,
    )
    return JSONResponse(status_code=exc.error_code.http_status, content=body)


@app.exception_handler(RequestValidationError)
def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(p) for p in err["loc"] if p not in ("body", "query", "form")),
            "value": err.get("input"),
            "reason": err["msg"],
        }
        for err in exc.errors()
    ]
    body = _error_body(
        status=COMMON_001_INVALID_INPUT.http_status,
        code=COMMON_001_INVALID_INPUT.code,
        message=COMMON_001_INVALID_INPUT.message,
        errors=errors,
        path=request.url.path,
    )
    return JSONResponse(status_code=COMMON_001_INVALID_INPUT.http_status, content=body)


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unexpected error while handling %s", request.url.path)
    body = _error_body(
        status=500,
        code="COMMON-999",
        message="서버 내부 오류가 발생했습니다.",
        errors=[],
        path=request.url.path,
    )
    return JSONResponse(status_code=500, content=body)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
