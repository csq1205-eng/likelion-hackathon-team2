from fastapi import APIRouter

from app.schemas.mission import MissionGenerateRequest, MissionGenerateResponse
from app.services.mission_service import MissionService

router = APIRouter(prefix="/api/ai/missions", tags=["missions"])
service = MissionService()


@router.post("/generate", response_model=MissionGenerateResponse)
def generate_missions(request: MissionGenerateRequest) -> MissionGenerateResponse:
    return service.generate(request)

