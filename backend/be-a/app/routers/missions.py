from fastapi import APIRouter, Depends

from app.dependencies import require_internal_key
from app.schemas.mission import MissionGenerateRequest, MissionGenerateResponse
from app.services.mission_service import MissionService

router = APIRouter(
    prefix="/api/ai/missions",
    tags=["missions"],
    dependencies=[Depends(require_internal_key)],
)
service = MissionService()


@router.post("/generate", response_model=MissionGenerateResponse)
def generate_missions(request: MissionGenerateRequest) -> MissionGenerateResponse:
    return service.generate(request)
