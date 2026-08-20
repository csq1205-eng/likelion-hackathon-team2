from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import require_internal_key
from app.schemas.common import ApiResponse
from app.schemas.highlight import (
    HighlightCompleteRequest,
    HighlightCompleteResponse,
    HighlightGenerateRequest,
    HighlightGenerateResponse,
)
from app.services.highlight_generator import HighlightGenerationError, HighlightSourceError
from app.services.highlight_service import HighlightService
from app.services.highlight_storage_service import HighlightStorageError


router = APIRouter(
    prefix="/api/ai/highlights",
    tags=["highlights"],
    dependencies=[Depends(require_internal_key)],
)
service = HighlightService()


@router.post("/generate", response_model=ApiResponse[HighlightGenerateResponse])
async def generate_highlight(request: HighlightGenerateRequest) -> ApiResponse[HighlightGenerateResponse]:
    try:
        return ApiResponse(data=await service.generate(request))
    except HighlightSourceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except HighlightGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    except HighlightStorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post("/complete", response_model=ApiResponse[HighlightCompleteResponse])
async def complete_highlight(request: HighlightCompleteRequest) -> ApiResponse[HighlightCompleteResponse]:
    return ApiResponse(data=await service.complete(request))
