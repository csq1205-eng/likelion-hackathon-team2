from fastapi import APIRouter, Depends

from app.dependencies import require_internal_key
from app.schemas.common import ApiResponse
from app.schemas.report import (
    PersonalWeeklyReportRequest,
    PersonalWeeklyReportResponse,
    WeeklyReportRequest,
    WeeklyReportResponse,
)
from app.services.report_service import (
    PersonalWeeklyReportService,
    WeeklyReportService,
)


router = APIRouter(
    prefix="/api/ai/reports",
    tags=["reports"],
    dependencies=[Depends(require_internal_key)],
)
weekly_service = WeeklyReportService()
personal_weekly_service = PersonalWeeklyReportService()


@router.post("/weekly", response_model=ApiResponse[WeeklyReportResponse])
def generate_weekly_report(
    request: WeeklyReportRequest,
) -> ApiResponse[WeeklyReportResponse]:
    return ApiResponse(data=weekly_service.generate(request))


@router.post(
    "/weekly/personal",
    response_model=ApiResponse[PersonalWeeklyReportResponse],
)
def generate_personal_weekly_report(
    request: PersonalWeeklyReportRequest,
) -> ApiResponse[PersonalWeeklyReportResponse]:
    return ApiResponse(data=personal_weekly_service.generate(request))
