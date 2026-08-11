from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile

from app.auth import resolve_user_id, verify_internal_key
from app.response import success
from app.schemas.clip import ShareUpdateRequest
from app.services.clip_service import ClipService

router = APIRouter(prefix="/api/clips", tags=["clips"])
service = ClipService()


@router.post("/upload")
def upload_clip(
    background_tasks: BackgroundTasks,
    missionId: int = Form(...),
    shared: bool = Form(...),
    clip: UploadFile = File(...),
    user_id: int = Depends(resolve_user_id),
):
    """미션 인증 클립 업로드 + 재촬영 (명세서 12.1 / 12.4는 동일 API).

    FastAPI가 Form() 파라미터의 alias를 OpenAPI 스키마(Swagger)에 반영하지 않는 문제가 있어
    (`alias="missionId"`로는 문서/Swagger "Try it out"이 여전히 mission_id로 표시됨),
    실제로 요청에서 받는 이름을 그대로 파라미터명으로 사용한다.
    """
    result = service.upload_clip(user_id=user_id, mission_id=missionId, upload=clip, shared=shared)

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
