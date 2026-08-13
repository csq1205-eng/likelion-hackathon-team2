from fastapi import APIRouter, Depends

from app.dependencies import require_internal_key
from app.schemas.common import ApiResponse
from app.schemas.report import WeeklyReportRequest, WeeklyReportResponse
from app.services.report_service import WeeklyReportService


router = APIRouter(
    prefix="/api/ai/reports",
    tags=["reports"],
    dependencies=[Depends(require_internal_key)],
)
service = WeeklyReportService()


@router.post("/weekly", response_model=ApiResponse[WeeklyReportResponse])
def generate_weekly_report(request: WeeklyReportRequest) -> ApiResponse[WeeklyReportResponse]:
    return ApiResponse(data=service.generate(request))
