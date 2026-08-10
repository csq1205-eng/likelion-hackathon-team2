from fastapi import APIRouter, Depends

from app.dependencies import require_internal_key
from app.schemas.verdict import VerdictReasonRequest, VerdictReasonResponse
from app.services.verdict_service import VerdictService


router = APIRouter(
    prefix="/api/ai/verdicts",
    tags=["verdicts"],
    dependencies=[Depends(require_internal_key)],
)
service = VerdictService()


@router.post("/reason", response_model=VerdictReasonResponse)
def create_verdict_reason(request: VerdictReasonRequest) -> VerdictReasonResponse:
    return service.create_user_reason(request)
