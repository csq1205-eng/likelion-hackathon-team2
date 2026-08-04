from fastapi import APIRouter

from app.schemas.verdict import VerdictReasonRequest, VerdictReasonResponse
from app.services.verdict_service import VerdictService


router = APIRouter(prefix="/api/ai/verdicts", tags=["verdicts"])
service = VerdictService()


@router.post("/reason", response_model=VerdictReasonResponse)
def create_verdict_reason(request: VerdictReasonRequest) -> VerdictReasonResponse:
    return service.create_user_reason(request)

