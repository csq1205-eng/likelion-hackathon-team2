from fastapi import APIRouter, Depends

from app.dependencies import require_internal_key
from app.schemas.report import WeeklyReportRequest, WeeklyReportResponse
from app.services.report_service import WeeklyReportService


router = APIRouter(
    prefix="/api/ai/reports",
    tags=["reports"],
    dependencies=[Depends(require_internal_key)],
)
service = WeeklyReportService()


@router.post("/weekly", response_model=WeeklyReportResponse)
def generate_weekly_report(request: WeeklyReportRequest) -> WeeklyReportResponse:
    return service.generate(request)
