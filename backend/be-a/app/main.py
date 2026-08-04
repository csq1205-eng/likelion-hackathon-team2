from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

from app.routers.missions import router as missions_router
from app.routers.verdicts import router as verdicts_router
from app.routers.highlights import router as highlights_router

app = FastAPI(
    title="WELLOG BE A",
    description="개인별 웰니스 미션과 추천 이유를 생성하는 AI 백엔드 MVP",
    version="0.1.0",
)

app.include_router(missions_router)
app.include_router(verdicts_router)
app.include_router(highlights_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
