from fastapi import APIRouter, Depends

from app.auth import verify_internal_key
from app.response import failure, success
from app.schemas.clip import WithdrawalCleanupRequest
from app.services.withdrawal_service import WithdrawalService

router = APIRouter(prefix="/api/ai/clips", tags=["internal"])
service = WithdrawalService()


@router.post("/withdrawal-cleanup", dependencies=[Depends(verify_internal_key)])
def withdrawal_cleanup(body: WithdrawalCleanupRequest):
    """BE C가 사용자 탈퇴 처리 중 호출하는 내부 API (명세서 16.4).

    프런트에서 직접 호출하지 않으며, 스토리지 정리에 실패하면 500과 함께
    cleanupStatus=FAILED를 반환해 BE C가 재시도/이상 확인 대상으로 남길 수 있게 한다.
    """
    try:
        result = service.cleanup_user_clips(user_id=body.user_id, withdrawal_id=body.withdrawal_id)
    except Exception:
        return failure(
            {"userId": body.user_id, "withdrawalId": body.withdrawal_id, "cleanupStatus": "FAILED"},
            message="클립 정리 작업이 실패했습니다.",
            status_code=500,
        )

    return success(result)
