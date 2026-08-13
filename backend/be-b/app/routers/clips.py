import json

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile

from app.auth import resolve_user_id, verify_internal_key
from app.errors import COMMON_001_INVALID_INPUT, ApiException
from app.response import success
from app.schemas.clip import ShareUpdateRequest
from app.services.clip_service import ClipService

router = APIRouter(prefix="/api/clips", tags=["clips"])
service = ClipService()


def _parse_criteria(raw: str | None) -> list[dict] | None:
    if raw is None:
        return None
    try:
        parsed = json.loads(raw)
    except ValueError as exc:
        raise ApiException(COMMON_001_INVALID_INPUT, message="criteria는 JSON 배열이어야 합니다.") from exc
    if not isinstance(parsed, list):
        raise ApiException(COMMON_001_INVALID_INPUT, message="criteria는 JSON 배열이어야 합니다.")
    return parsed


@router.post("/upload")
def upload_clip(
    background_tasks: BackgroundTasks,
    missionId: int = Form(...),
    shared: bool = Form(...),
    clip: UploadFile = File(...),
    missionTitle: str | None = Form(default=None),
    criteria: str | None = Form(
        default=None,
        description='BE A verificationCriteria와 동일한 형태의 JSON 배열 문자열. 예: [{"id":"product_visible","description":"제품이 보여야 함"}]',
    ),
    user_id: int = Depends(resolve_user_id),
):
    """미션 인증 클립 업로드 + 재촬영 (명세서 12.1 / 12.4는 동일 API).

    FastAPI가 Form() 파라미터의 alias를 OpenAPI 스키마(Swagger)에 반영하지 않는 문제가 있어
    (`alias="missionId"`로는 문서/Swagger "Try it out"이 여전히 mission_id로 표시됨),
    실제로 요청에서 받는 이름을 그대로 파라미터명으로 사용한다.

    `missionTitle`/`criteria`는 선택 항목이다 (README "확인 필요" 6번). BE A의 미션 생성
    결과에 이미 `title`/`verificationCriteria`가 있으므로, 프론트가 업로드 시 그대로 실어
    보내면 AI가 고정된 기준으로 판정하고 BE A 판정 이유 호출에도 미션 제목이 실린다.
    """
    criteria_hint = _parse_criteria(criteria)
    result = service.upload_clip(
        user_id=user_id,
        mission_id=missionId,
        upload=clip,
        shared=shared,
        mission_title=missionTitle,
        criteria_hint=criteria_hint,
    )

    if result.judgement_status == "PROCESSING":
        background_tasks.add_task(
            service.retry_processing_judgement, result.clip_id, result.judgement_request_id
        )
        return success(result, message="판정이 지연되어 처리 중입니다.", status_code=202)

    return success(result)


@router.get("/{clip_id}/result")
def get_clip_result(clip_id: int, user_id: int = Depends(resolve_user_id)):
    """명세서 12.3: 업로드가 202를 반환했을 때 폴링으로 조회하는 API."""
    result = service.get_result(user_id=user_id, clip_id=clip_id)
    return success(result)


@router.patch("/{clip_id}/share")
def update_clip_share(
    clip_id: int, body: ShareUpdateRequest, user_id: int = Depends(resolve_user_id)
):
    result = service.update_share(user_id=user_id, clip_id=clip_id, shared=body.shared)
    return success(result)


@router.post("/{clip_id}/highlight-complete", dependencies=[Depends(verify_internal_key)])
def complete_highlight(clip_id: int):
    """BE A가 하이라이트 저장 완료 후 호출하는 콜백. X-Internal-Key로 인증한다."""
    result = service.complete_highlight(clip_id=clip_id)
    return success(result)


@router.delete("/{clip_id}")
def delete_clip(clip_id: int, user_id: int = Depends(resolve_user_id)):
    result = service.delete_clip(user_id=user_id, clip_id=clip_id)
    return success(result)
