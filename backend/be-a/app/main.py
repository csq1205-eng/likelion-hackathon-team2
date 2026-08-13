import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


load_dotenv()

from app.routers.highlights import router as highlights_router
from app.routers.missions import router as missions_router
from app.routers.reports import router as reports_router
from app.routers.verdicts import router as verdicts_router


app = FastAPI(
    title="WELLOG BE A",
    description="개인별 웰니스 미션, 판정 이유와 그룹 하이라이트를 생성하는 AI 백엔드 MVP",
    version="0.2.0",
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    ).split(",")
    if origin.strip()
]

if allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Authorization",
            "Content-Type",
            "X-Internal-Key",
        ],
    )

app.include_router(missions_router)
app.include_router(verdicts_router)
app.include_router(highlights_router)
app.include_router(reports_router)

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