from app.db import db_session
from app.schemas.clip import WithdrawalCleanupResponse
from app.services import retention_service


class WithdrawalService:
    """BE C가 사용자 탈퇴 처리 중 호출하는 내부 API(16.4)를 담당한다.

    보관 정책과 무관하게 해당 사용자의 모든 클립/프레임을 즉시 파기하고,
    이미 정리된 사용자를 다시 호출해도 안전하도록(idempotent) 처리한다.
    """

    def cleanup_user_clips(self, user_id: int, withdrawal_id: int) -> WithdrawalCleanupResponse:
        with db_session() as conn:
            clips = conn.execute(
                "SELECT * FROM mission_clips WHERE user_id = ? AND deleted = 0",
                (user_id,),
            ).fetchall()

            if not clips:
                return WithdrawalCleanupResponse(
                    user_id=user_id,
                    withdrawal_id=withdrawal_id,
                    deleted_clip_count=0,
                    deleted_frame_count=0,
                    cleanup_status="NO_CLIPS",
                    idempotent=True,
                )

            deleted_frame_count = 0
            for clip in clips:
                frame_count_row = conn.execute(
                    "SELECT COUNT(*) AS cnt FROM mission_clip_frames WHERE clip_id = ?",
                    (clip["clip_id"],),
                ).fetchone()
                deleted_frame_count += frame_count_row["cnt"]
                retention_service.purge_clip(conn, clip)

        return WithdrawalCleanupResponse(
            user_id=user_id,
            withdrawal_id=withdrawal_id,
            deleted_clip_count=len(clips),
            deleted_frame_count=deleted_frame_count,
            cleanup_status="COMPLETED",
            idempotent=False,
        )
