import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

load_dotenv()

from app.routers.missions import router as missions_router
from app.routers.verdicts import router as verdicts_router
from app.routers.highlights import router as highlights_router
from app.routers.reports import router as reports_router

app = FastAPI(
    title="WEDIT BE A",
    description="개인별 웰니스 미션, 판정 이유와 그룹 하이라이트를 생성하는 AI 백엔드 MVP",
    version="0.2.0",
)

app.include_router(missions_router)
app.include_router(verdicts_router)
app.include_router(highlights_router)
app.include_router(reports_router)


def error_body(request: Request, status_code: int, code: str, message: str, errors=None):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": status_code,
        "code": code,
        "message": message,
        "errors": errors or [],
        "path": request.url.path,
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", ()) if part != "body"]
        errors.append(
            {
                "field": ".".join(location),
                "value": error.get("input"),
                "reason": error.get("msg", "입력값이 올바르지 않습니다."),
            }
        )
    return JSONResponse(
        status_code=422,
        content=error_body(
            request,
            422,
            "COMMON-001",
            "입력값이 올바르지 않습니다.",
            errors,
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 401:
        code = "AUTH-001"
    elif exc.status_code == 403:
        code = "AUTH-002"
    else:
        code = "COMMON-002"
    message = exc.detail if isinstance(exc.detail, str) else "요청을 처리하지 못했습니다."
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(request, exc.status_code, code, message),
        headers=exc.headers,
    )

highlight_output_dir = Path(
    os.getenv("HIGHLIGHT_OUTPUT_DIR", "generated/highlights")
).resolve()
highlight_output_dir.mkdir(parents=True, exist_ok=True)
app.mount(
    "/generated/highlights",
    StaticFiles(directory=highlight_output_dir),
    name="generated-highlights",
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
