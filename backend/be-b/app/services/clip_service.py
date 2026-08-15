import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile

from app.config import settings
from app.db import db_session
from app.errors import (
    AI_001_JUDGEMENT_FAILED,
    CLIP_001_NOT_FOUND,
    FILE_001_INVALID_TYPE,
    MISSION_003_RETRY_EXCEEDED,
    MISSION_005_DAILY_LIMIT_EXCEEDED,
    ApiException,
)
from app.schemas.clip import (
    ClipResultResponse,
    ClipUploadResponse,
    DeleteClipResponse,
    HighlightCompleteResponse,
    ShareUpdateResponse,
)
from app.services import retention_service
from app.services.frame_extraction import FrameExtractionError, extract_frames
from app.services.mission_result_client import MissionResultClient
from app.services.reason_client import ReasonClient
from app.services.vision_service import (
    VisionService,
    VisionServiceCallError,
    VisionServiceUnavailable,
)
from app.storage import (
    delete_clip_assets,
    save_clip_file,
    save_frame_bytes,
    to_public_url,
    validate_clip_file,
)

PROMPT_VERSION = "mission-judge-prompt-v1"
POLLING_INTERVAL_SECONDS = 3


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ClipService:
    def __init__(
        self,
        vision_service: Optional[VisionService] = None,
        reason_client: Optional[ReasonClient] = None,
        frame_extractor=extract_frames,
        mission_result_client: Optional[MissionResultClient] = None,
    ):
        self.vision_service = vision_service or VisionService()
        self.reason_client = reason_client or ReasonClient()
        self.frame_extractor = frame_extractor
        self.mission_result_client = mission_result_client or MissionResultClient()

    # ------------------------------------------------------------------
    # 업로드 / 재촬영 (POST /api/clips/upload)
    # ------------------------------------------------------------------
    def upload_clip(
        self,
        user_id: int,
        mission_id: int,
        upload: UploadFile,
        shared: bool,
        mission_title: Optional[str] = None,
        criteria_hint: Optional[List[dict]] = None,
    ) -> ClipUploadResponse:
        extension = validate_clip_file(upload)

        with db_session() as conn:
            attempt_no, prior_fail_count, prior_total_count = self._compute_attempt_state(
                conn, mission_id
            )
            if (
                prior_fail_count >= settings.max_fail_retry_count
                or prior_total_count >= settings.max_total_attempt_count
            ):
                raise ApiException(MISSION_003_RETRY_EXCEEDED)

            self._check_and_reserve_daily_limit(conn, user_id)

            retention_policy, retention_expires_at = retention_service.compute_retention(
                shared, judged_at=None
            )
            clip_id = self._insert_pending_clip(
                conn,
                mission_id,
                user_id,
                attempt_no,
                shared,
                retention_policy,
                retention_expires_at,
                mission_title,
                criteria_hint,
            )

        clip_path: Optional[Path] = None
        try:
            clip_path = save_clip_file(upload, clip_id, extension)
            source_clip_url = to_public_url(clip_path)
            with db_session() as conn:
                conn.execute(
                    "UPDATE mission_clips SET source_clip_url = ?, source_clip_path = ? WHERE clip_id = ?",
                    (source_clip_url, str(clip_path), clip_id),
                )

            frame_paths = self._extract_and_store_frames(clip_id, clip_path)
        except ApiException:
            self._discard_reserved_clip(clip_id, clip_path)
            raise
        except FrameExtractionError as exc:
            self._discard_reserved_clip(clip_id, clip_path)
            raise ApiException(
                FILE_001_INVALID_TYPE,
                message=f"영상에서 프레임을 추출하지 못했습니다: {exc}",
            ) from exc

        judgement_request_id = self._create_judgement_request(clip_id=clip_id, mission_id=mission_id)

        retry_fields = {}
        if attempt_no > 1:
            retry_fields = {
                "retry_count": prior_fail_count,
                "max_retry_count": settings.max_fail_retry_count,
                "remaining_retry_count": max(settings.max_fail_retry_count - prior_fail_count, 0),
            }

        try:
            verdict = self.vision_service.judge(
                frame_paths, mission_title=mission_title, criteria_hint=criteria_hint
            )
        except VisionServiceUnavailable:
            # OPENAI_API_KEY 미설정 등 재시도해도 성공할 수 없는 설정 오류 -> 즉시 AI-001.
            self._finalize_error(clip_id, mission_id, user_id, judgement_request_id)
            raise ApiException(AI_001_JUDGEMENT_FAILED, message="AI 판정 서비스가 설정되지 않았습니다.")
        except VisionServiceCallError:
            # 네트워크 오류/타임아웃 등 일시적 오류 -> 큐잉 후 202, 백그라운드에서 재시도.
            self._mark_processing(judgement_request_id)
            return ClipUploadResponse(
                mission_id=mission_id,
                clip_id=clip_id,
                attempt_no=attempt_no,
                frame_count=len(frame_paths),
                shared=shared,
                judgement_request_id=judgement_request_id,
                judgement_status="PROCESSING",
                polling_interval_seconds=POLLING_INTERVAL_SECONDS,
                **retry_fields,
            )

        judged_at = _now()
        reason, _source = self.reason_client.get_reason(
            mission_id=mission_id,
            clip_id=clip_id,
            verdict=verdict.verdict,
            confidence_score=verdict.confidence_score,
            criteria=verdict.criteria,
            model_notes=verdict.model_notes,
            mission_title=mission_title,
        )

        self._finalize_judgement(
            clip_id=clip_id,
            mission_id=mission_id,
            user_id=user_id,
            judgement_request_id=judgement_request_id,
            result=verdict.verdict,
            reason=reason,
            confidence_score=verdict.confidence_score,
            model_notes=verdict.model_notes,
            judged_at=judged_at,
        )

        retention_policy, retention_expires_at = retention_service.compute_retention(shared, judged_at)
        with db_session() as conn:
            conn.execute(
                "UPDATE mission_clips SET retention_policy = ?, retention_expires_at = ? WHERE clip_id = ?",
                (retention_policy, retention_expires_at, clip_id),
            )
            source_clip_url = conn.execute(
                "SELECT source_clip_url FROM mission_clips WHERE clip_id = ?", (clip_id,)
            ).fetchone()["source_clip_url"]

        return ClipUploadResponse(
            mission_id=mission_id,
            clip_id=clip_id,
            source_clip_url=source_clip_url,
            attempt_no=attempt_no,
            frame_count=len(frame_paths),
            shared=shared,
            judgement_request_id=judgement_request_id,
            judgement_status="COMPLETED",
            result=verdict.verdict,
            reason=reason,
            confidence_score=verdict.confidence_score,
            prompt_version=PROMPT_VERSION,
            model_version=self.vision_service.model,
            judged_at=judged_at,
            retention_policy=retention_policy,
            retention_expires_at=retention_expires_at,
            **retry_fields,
        )

    def retry_processing_judgement(self, clip_id: int, judgement_request_id: int) -> None:
        """202로 응답한 뒤 백그라운드에서 한 번 더 시도한다 (BackgroundTasks에서 호출).

        재시도도 실패하면 사용자 책임이 아닌 시스템 오류(ERROR)로 종료 처리한다.
        재시도 큐/스케줄러 없이 단순화한 MVP 구현이다.
        """
        with db_session() as conn:
            clip = conn.execute(
                "SELECT * FROM mission_clips WHERE clip_id = ?", (clip_id,)
            ).fetchone()
        if clip is None:
            return

        frames_dir = settings.storage_root / "frames" / str(clip_id)
        frame_paths = sorted(frames_dir.glob("*.jpg"), key=lambda p: int(p.stem))

        mission_title = clip["mission_title"]
        criteria_hint = json.loads(clip["criteria_hint"]) if clip["criteria_hint"] else None

        try:
            verdict = self.vision_service.judge(
                frame_paths, mission_title=mission_title, criteria_hint=criteria_hint
            )
        except (VisionServiceUnavailable, VisionServiceCallError):
            self._finalize_error(clip_id, clip["mission_id"], clip["user_id"], judgement_request_id)
            return

        judged_at = _now()
        reason, _source = self.reason_client.get_reason(
            mission_id=clip["mission_id"],
            clip_id=clip_id,
            verdict=verdict.verdict,
            confidence_score=verdict.confidence_score,
            criteria=verdict.criteria,
            model_notes=verdict.model_notes,
            mission_title=mission_title,
        )
        self._finalize_judgement(
            clip_id=clip_id,
            mission_id=clip["mission_id"],
            user_id=clip["user_id"],
            judgement_request_id=judgement_request_id,
            result=verdict.verdict,
            reason=reason,
            confidence_score=verdict.confidence_score,
            model_notes=verdict.model_notes,
            judged_at=judged_at,
        )
        retention_policy, retention_expires_at = retention_service.compute_retention(
            bool(clip["shared"]), judged_at
        )
        with db_session() as conn:
            conn.execute(
                "UPDATE mission_clips SET retention_policy = ?, retention_expires_at = ? WHERE clip_id = ?",
                (retention_policy, retention_expires_at, clip_id),
            )

    # ------------------------------------------------------------------
    # 판정 결과 조회 (GET /api/clips/{clipId}/result)
    # ------------------------------------------------------------------
    def get_result(self, user_id: int, clip_id: int) -> ClipResultResponse:
        with db_session() as conn:
            clip = self._get_owned_clip(conn, user_id, clip_id)
            request_row = conn.execute(
                """
                SELECT * FROM ai_judgement_requests
                WHERE clip_id = ?
                ORDER BY judgement_request_id DESC
                LIMIT 1
                """,
                (clip_id,),
            ).fetchone()

        if request_row is None:
            raise ApiException(CLIP_001_NOT_FOUND, message="해당 클립의 판정 요청이 없습니다.")

        status = request_row["status"]
        return ClipResultResponse(
            mission_id=clip["mission_id"],
            clip_id=clip_id,
            attempt_no=clip["attempt_no"],
            status=status,
            result=request_row["result"],
            reason=request_row["reason"],
            confidence_score=request_row["confidence_score"],
            prompt_version=request_row["prompt_version"],
            model_version=request_row["model_version"],
            judged_at=request_row["judged_at"],
            polling_interval_seconds=POLLING_INTERVAL_SECONDS if status == "PROCESSING" else None,
        )

    # ------------------------------------------------------------------
    # 공유 여부 변경 (PATCH /api/clips/{clipId}/share)
    # ------------------------------------------------------------------
    def update_share(self, user_id: int, clip_id: int, shared: bool) -> ShareUpdateResponse:
        with db_session() as conn:
            clip = self._get_owned_clip(conn, user_id, clip_id)

            judged_at_raw = conn.execute(
                """
                SELECT judged_at FROM ai_judgement_requests
                WHERE clip_id = ? AND status = 'COMPLETED'
                ORDER BY judgement_request_id DESC LIMIT 1
                """,
                (clip_id,),
            ).fetchone()
            judged_at = (
                datetime.fromisoformat(judged_at_raw["judged_at"]) if judged_at_raw and judged_at_raw["judged_at"] else None
            )

            retention_policy, retention_expires_at = retention_service.compute_retention(shared, judged_at)
            conn.execute(
                """
                UPDATE mission_clips
                SET shared = ?, share_decided = 1, retention_policy = ?, retention_expires_at = ?
                WHERE clip_id = ?
                """,
                (int(shared), retention_policy, retention_expires_at, clip_id),
            )

            # highlight-complete가 공유 결정보다 먼저 도착했었고 이제 비공유로 확정된 경우
            # 유예 없이 즉시 파기한다.
            if not shared and clip["highlight_generated_at"]:
                refreshed = conn.execute(
                    "SELECT * FROM mission_clips WHERE clip_id = ?", (clip_id,)
                ).fetchone()
                retention_service.purge_clip(conn, refreshed)

        return ShareUpdateResponse(
            clip_id=clip_id,
            shared=shared,
            share_decided=True,
            retention_policy=retention_policy,
            retention_expires_at=retention_expires_at,
        )

    # ------------------------------------------------------------------
    # 하이라이트 생성 완료 콜백 (POST /api/clips/{clipId}/highlight-complete)
    # ------------------------------------------------------------------
    def complete_highlight(self, clip_id: int) -> HighlightCompleteResponse:
        with db_session() as conn:
            clip = conn.execute(
                "SELECT * FROM mission_clips WHERE clip_id = ?", (clip_id,)
            ).fetchone()
            if clip is None:
                raise ApiException(CLIP_001_NOT_FOUND)

            conn.execute(
                "UPDATE mission_clips SET highlight_generated_at = ? WHERE clip_id = ?",
                (retention_service.now_iso(), clip_id),
            )

            if not clip["shared"]:
                refreshed = conn.execute(
                    "SELECT * FROM mission_clips WHERE clip_id = ?", (clip_id,)
                ).fetchone()
                retention_service.purge_clip(conn, refreshed)

        return HighlightCompleteResponse(clip_id=clip_id, highlight_completed=True)

    # ------------------------------------------------------------------
    # 클립 삭제 (DELETE /api/clips/{clipId})
    # ------------------------------------------------------------------
    def delete_clip(self, user_id: int, clip_id: int) -> DeleteClipResponse:
        with db_session() as conn:
            clip = self._get_owned_clip(conn, user_id, clip_id)
            retention_service.purge_clip(conn, clip)

        return DeleteClipResponse(clip_id=clip_id, deleted=True)

    # ------------------------------------------------------------------
    # 내부 헬퍼
    # ------------------------------------------------------------------
    def _get_owned_clip(self, conn: sqlite3.Connection, user_id: int, clip_id: int) -> sqlite3.Row:
        clip = conn.execute(
            "SELECT * FROM mission_clips WHERE clip_id = ? AND user_id = ? AND deleted = 0",
            (clip_id, user_id),
        ).fetchone()
        if clip is None:
            # 존재 여부를 노출하지 않기 위해 소유자가 아닌 경우도 동일하게 404 처리한다.
            raise ApiException(CLIP_001_NOT_FOUND)
        return clip

    def _compute_attempt_state(self, conn: sqlite3.Connection, mission_id: int):
        attempt_no = (
            conn.execute(
                "SELECT COUNT(*) AS cnt FROM mission_clips WHERE mission_id = ?", (mission_id,)
            ).fetchone()["cnt"]
            + 1
        )

        results = conn.execute(
            "SELECT result FROM mission_results WHERE mission_id = ? ORDER BY id ASC",
            (mission_id,),
        ).fetchall()

        fail_count = 0
        total_count = 0
        for row in results:
            result = row["result"]
            if result == "ERROR":
                # AI 시스템 오류는 재촬영 횟수에 포함하지 않는다.
                continue
            total_count += 1
            if result == "PASS":
                fail_count = 0
            elif result == "FAIL":
                fail_count += 1

        return attempt_no, fail_count, total_count

    def _check_and_reserve_daily_limit(self, conn: sqlite3.Connection, user_id: int) -> None:
        today = _now().date().isoformat()
        row = conn.execute(
            "SELECT call_count FROM daily_ai_judgement_limits WHERE user_id = ? AND limit_date = ?",
            (user_id, today),
        ).fetchone()
        call_count = row["call_count"] if row else 0

        if call_count >= settings.daily_ai_judgement_limit:
            raise ApiException(MISSION_005_DAILY_LIMIT_EXCEEDED)

        if row:
            conn.execute(
                "UPDATE daily_ai_judgement_limits SET call_count = call_count + 1 WHERE user_id = ? AND limit_date = ?",
                (user_id, today),
            )
        else:
            conn.execute(
                "INSERT INTO daily_ai_judgement_limits (user_id, limit_date, call_count) VALUES (?, ?, 1)",
                (user_id, today),
            )

    def _insert_pending_clip(
        self,
        conn: sqlite3.Connection,
        mission_id: int,
        user_id: int,
        attempt_no: int,
        shared: bool,
        retention_policy: str,
        retention_expires_at: Optional[str],
        mission_title: Optional[str] = None,
        criteria_hint: Optional[List[dict]] = None,
    ) -> int:
        cursor = conn.execute(
            """
            INSERT INTO mission_clips (
                mission_id, user_id, attempt_no, source_clip_url, source_clip_path,
                shared, share_decided, retention_policy, retention_expires_at, created_at,
                mission_title, criteria_hint
            ) VALUES (?, ?, ?, '', '', ?, 1, ?, ?, ?, ?, ?)
            """,
            (
                mission_id,
                user_id,
                attempt_no,
                int(shared),
                retention_policy,
                retention_expires_at,
                retention_service.now_iso(),
                mission_title,
                json.dumps(criteria_hint) if criteria_hint is not None else None,
            ),
        )
        return cursor.lastrowid

    def _discard_reserved_clip(self, clip_id: int, clip_path: Optional[Path]) -> None:
        """검증 실패 시 예약해 둔 clip 행과 파일(원본 + 추출된 프레임)을 완전히 제거한다.

        재촬영 횟수에도 포함하지 않는다 (attempt_no는 다음 시도에서 자동으로 이 행을 세지 않음).
        """
        if clip_path is not None:
            delete_clip_assets(str(clip_path), clip_id)
        with db_session() as conn:
            conn.execute("DELETE FROM mission_clip_frames WHERE clip_id = ?", (clip_id,))
            conn.execute("DELETE FROM mission_clips WHERE clip_id = ?", (clip_id,))

    def _extract_and_store_frames(self, clip_id: int, clip_path: Path) -> List[Path]:
        saved_paths: List[Path] = []

        def _save(order: int, tmp_path: Path) -> None:
            dest = save_frame_bytes(clip_id, order, tmp_path.open("rb"))
            saved_paths.append(dest)
            with db_session() as conn:
                conn.execute(
                    """
                    INSERT INTO mission_clip_frames (clip_id, frame_url, frame_path, frame_order, extracted_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (clip_id, to_public_url(dest), str(dest), order, retention_service.now_iso()),
                )

        self.frame_extractor(clip_path, _save)
        return saved_paths

    def _create_judgement_request(self, clip_id: int, mission_id: int) -> int:
        with db_session() as session:
            cursor = session.execute(
                """
                INSERT INTO ai_judgement_requests (clip_id, mission_id, status, requested_at)
                VALUES (?, ?, 'REQUESTED', ?)
                """,
                (clip_id, mission_id, retention_service.now_iso()),
            )
            return cursor.lastrowid

    def _mark_processing(self, judgement_request_id: int) -> None:
        with db_session() as conn:
            conn.execute(
                "UPDATE ai_judgement_requests SET status = 'PROCESSING' WHERE judgement_request_id = ?",
                (judgement_request_id,),
            )

    def _finalize_judgement(
        self,
        clip_id: int,
        mission_id: int,
        user_id: int,
        judgement_request_id: int,
        result: str,
        reason: str,
        confidence_score: float,
        model_notes: str,
        judged_at: datetime,
    ) -> None:
        with db_session() as conn:
            conn.execute(
                """
                UPDATE ai_judgement_requests
                SET status = 'COMPLETED', result = ?, reason = ?, confidence_score = ?,
                    prompt_version = ?, model_version = ?, model_notes = ?, judged_at = ?
                WHERE judgement_request_id = ?
                """,
                (
                    result,
                    reason,
                    confidence_score,
                    PROMPT_VERSION,
                    self.vision_service.model,
                    model_notes,
                    judged_at.isoformat(),
                    judgement_request_id,
                ),
            )
            conn.execute(
                """
                INSERT INTO mission_results (mission_id, user_id, clip_id, result, judged_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (mission_id, user_id, clip_id, result, judged_at.isoformat(), retention_service.now_iso()),
            )

        self.mission_result_client.notify_result(
            mission_id=mission_id,
            clip_id=clip_id,
            result=result,
            judged_at=judged_at,
            reason=reason,
            confidence_score=confidence_score,
            prompt_version=PROMPT_VERSION,
            model_version=self.vision_service.model,
        )

    def _finalize_error(self, clip_id: int, mission_id: int, user_id: int, judgement_request_id: int) -> None:
        judged_at = _now()
        reason, _source = self.reason_client.get_reason(
            mission_id=mission_id,
            clip_id=clip_id,
            verdict="ERROR",
            confidence_score=0.0,
            criteria=[],
            model_notes="vision service unavailable after retry",
        )
        with db_session() as conn:
            conn.execute(
                """
                UPDATE ai_judgement_requests
                SET status = 'COMPLETED', result = 'ERROR', reason = ?, judged_at = ?
                WHERE judgement_request_id = ?
                """,
                (reason, judged_at.isoformat(), judgement_request_id),
            )
            conn.execute(
                """
                INSERT INTO mission_results (mission_id, user_id, clip_id, result, judged_at, created_at)
                VALUES (?, ?, ?, 'ERROR', ?, ?)
                """,
                (mission_id, user_id, clip_id, judged_at.isoformat(), retention_service.now_iso()),
            )

        self.mission_result_client.notify_result(
            mission_id=mission_id,
            clip_id=clip_id,
            result="ERROR",
            judged_at=judged_at,
            reason=reason,
        )
