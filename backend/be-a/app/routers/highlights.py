import httpx
from fastapi import APIRouter, HTTPException, status

from app.schemas.highlight import HighlightCompleteRequest, HighlightCompleteResponse
from app.services.callback_service import CallbackConfigurationError
from app.services.highlight_service import HighlightService


router = APIRouter(prefix="/api/ai/highlights", tags=["highlights"])
service = HighlightService()


@router.post("/complete", response_model=HighlightCompleteResponse)
async def complete_highlight(request: HighlightCompleteRequest) -> HighlightCompleteResponse:
    try:
        return await service.complete(request)
    except CallbackConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="BE B 하이라이트 완료 콜백 호출에 실패했습니다.",
        )

