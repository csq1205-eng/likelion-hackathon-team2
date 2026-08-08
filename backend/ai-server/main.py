"""
Welllog - BE B: 미디어 파이프라인 & 비전 판정 서비스
클립 업로드 -> 프레임 추출 -> 비전 모델 판정 -> 결과 반환
+ 클립 처리 정책 (24시간 파기 스케줄러)
+ 네트워크 오류 대응 (재처리 큐)

담당 기능 (기능명세서 기준):
- 클립 업로드 (API)
- 클립 프레임 추출
- 미션 수행 판정
- 재촬영 횟수 제한 (API)
- 클립 처리 정책 / 공유 여부 선택 (API)
- 네트워크 오류 대응 (재처리 큐)

주의: 이 파일의 엔드포인트는 전부 `async def`가 아니라 `def`다.
      내부에서 ffmpeg/OpenAI/SQLite 같은 동기 블로킹 호출을 하기 때문에,
      async로 두면 업로드 한 건이 도는 10~15초 동안 서버 전체(=/health 포함)가 멈춘다.
      `def`로 두면 FastAPI가 스레드풀에서 실행해 동시 업로드가 가능해진다.
"""
import json
import os
import uuid

from dotenv import load_dotenv
load_dotenv(encoding="utf-8-sig")  # .env 파일을 읽어서 환경변수로 자동 등록 (Windows BOM 대응)

from fastapi import FastAPI, Request, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import db
import mission_lookup
from db import MAX_TOTAL_ATTEMPTS
from pipeline import process_clip, parse_criteria
from errors import is_retryable, retry_budget_for
from exceptions import (
    WellLogError,
    InvalidInputError,
    InvalidFileFormatError,
    RetryLimitExceededError,
    TotalAttemptsExceededError,
    AIJudgementFailedError,
    FileTooLargeError,
    ClipNotFoundError,
    ClipAlreadyPurgedError,
    ClipPurgeFailedError,
    InvalidInternalKeyError,
)
from frame_extraction import cleanup_frames
from retention_policy import purge_clip_assets, purge_clip_file
from scheduler import start_scheduler, stop_scheduler

UPLOAD_DIR = "storage/clips"
FRAME_DIR = "storage/frames"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAME_DIR, exist_ok=True)

MAX_MISSION_RETRIES = 3        # 판정 'fail'로 소진되는 재촬영 횟수
# MAX_TOTAL_ATTEMPTS는 db.py에 정의 (scheduler.py의 재처리 큐도 같은 값을 참조해야 함)
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "20"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

# 기능명세서 12.1: MVP 기준 MP4, MOV만 허용.
ALLOWED_CLIP_EXTENSIONS = {".mp4", ".mov"}

# 콤마 구분. 예: ALLOWED_ORIGINS=http://localhost:5173,https://welllog.app
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# 설정되어 있으면 X-Internal-Key 헤더를 요구한다. 비워두면 개발 모드(무인증).
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "").strip()


def require_internal_key(x_internal_key: Optional[str] = Header(default=None)):
    """BE B는 사용자 인증을 직접 하지 않는다.
    대신 BE A/C(또는 게이트웨이)만 호출할 수 있도록 공유 시크릿을 확인한다.
    이게 없으면 누구나 임의 clip_id를 DELETE하거나 OpenAI 크레딧을 태울 수 있다."""
    if not INTERNAL_API_KEY:
        return
    if x_internal_key != INTERNAL_API_KEY:
        raise InvalidInternalKeyError("유효하지 않은 내부 인증 키입니다.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    if not INTERNAL_API_KEY:
        print("[warn] INTERNAL_API_KEY가 설정되지 않았습니다. 무인증 모드로 실행됩니다(로컬 개발용).")
    if ALLOWED_ORIGINS == ["*"]:
        print("[warn] ALLOWED_ORIGINS가 '*'입니다. 배포 전 실제 오리진으로 좁히세요.")
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Welllog BE B - Media & Vision Pipeline", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOWED_ORIGINS != ["*"],  # '*'와 credentials는 함께 쓸 수 없다
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(WellLogError)
async def welllog_error_handler(request: Request, exc: WellLogError):
    """기능명세서 5번 섹션(공통 오류 응답) 형식으로 통일해서 반환한다.
    이 서비스가 던지는 모든 비즈니스 오류는 WellLogError를 거쳐 여기로 모인다."""
    return JSONResponse(
        status_code=exc.http_status,
        content={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": exc.http_status,
            "code": exc.code,
            "message": exc.message,
            "errors": exc.errors,
            "path": request.url.path,
        },
    )


def _validate_file_format(clip_file: UploadFile):
    """확장자만으로 판단한다(컨테이너 내부 포맷까지는 검증하지 않음).
    진짜로 다른 포맷인 파일은 이후 ffprobe 단계(frame_extraction.py)에서 걸러진다 —
    여기서는 명백히 잘못된 확장자를 빠르게, 파일을 저장하기 전에 쳐낸다."""
    _, ext = os.path.splitext(clip_file.filename or "")
    if ext.lower() not in ALLOWED_CLIP_EXTENSIONS:
        raise InvalidFileFormatError(
            f"허용되지 않은 파일 형식입니다: {ext or '(확장자 없음)'} (MP4, MOV만 허용)"
        )


def _save_upload(clip_file: UploadFile, clip_path: str):
    """업로드 파일을 스트리밍으로 저장하면서 용량 상한을 강제한다.
    상한 없이 받으면 4K 장시간 영상 하나로 디스크/추출 시간이 폭주할 수 있다."""
    size = 0
    with open(clip_path, "wb") as f:
        while True:
            chunk = clip_file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                f.close()
                purge_clip_assets("", clip_path)
                raise FileTooLargeError(f"클립 용량이 너무 큽니다. (최대 {MAX_UPLOAD_MB}MB)")
            f.write(chunk)
    if size == 0:
        purge_clip_assets("", clip_path)
        raise InvalidInputError("빈 파일입니다.")


@app.post("/api/clips/upload", dependencies=[Depends(require_internal_key)])
def upload_clip(
    mission_id: str = Form(...),
    mission_label: str = Form(...),
    clip: UploadFile = File(...),
    criteria: Optional[str] = Form(default=None),
):
    """
    1. 클립 업로드
    2. 프레임 4장 추출 (판정 직후 즉시 삭제됨)
    3. 비전 모델 판정 + 임계값 정책 적용
    4. 판정 결과 반환 (BE A가 이 결과로 판정 근거 문장을 생성)

    criteria(선택): 미션 정의에 딸린 판정 기준을 JSON 문자열로 넘기면 프롬프트에 주입된다.
      예) [{"id":"cup_visible","description":"컵이 화면에 보인다"},
           {"id":"drinking_motion","description":"마시는 동작이 확인된다"}]
      넘기지 않으면 모델이 criteria를 스스로 만든다(집계는 어려워짐).

    user_id는 의도적으로 이 API의 파라미터가 아니다. 호출자(BE A)가 같이 보낸 값을
    그대로 믿으면 오귀속/스푸핑 위험이 있어서(내부 키 유출, 버그로 잘못된 값 전달 등),
    "이 mission_id가 누구 것인지"는 BE B가 mission_lookup.get_mission(mission_id)로
    직접 조회해서 확인해야 한다. 다만 그 함수는 아직 구현되지 않아서(NotImplementedError),
    지금은 clips.user_id가 전부 NULL로 남는다 — 즉 POST /api/ai/clips/withdrawal-cleanup은
    get_mission()이 연결되기 전까지는 실질적으로 아무 클립도 찾지 못한다. 연결되면
    여기서 mission_info = get_mission(mission_id) 호출 한 줄만 추가하면 된다.

    네트워크성 오류(OpenAI 연결 끊김/타임아웃/레이트리밋)나 모델 스키마 위반은
    사용자 재촬영 횟수를 차감하지 않고 재처리 큐에 넣은 뒤 202를 반환한다.
    그 외 오류(예: 손상된 파일)는 재시도해도 의미 없으므로 즉시 실패 처리한다.
    """
    # 형식이 잘못된 파일/criteria는 다른 자원을 건드리기 전에 가장 먼저 걸러낸다.
    _validate_file_format(clip)

    if db.get_retry_count(mission_id) >= MAX_MISSION_RETRIES:
        raise RetryLimitExceededError("재촬영 횟수를 초과했습니다.")
    if db.get_total_attempts(mission_id) >= MAX_TOTAL_ATTEMPTS:
        raise TotalAttemptsExceededError("이 미션의 인증 시도 한도를 초과했습니다.")

    # 형식이 잘못된 criteria는 파일 저장/시도횟수 차감 전에 먼저 걸러낸다.
    # (여기서 실패하면 아무 자원도 소비하지 않은 상태로 끝나야 한다)
    parsed_criteria = parse_criteria(criteria)

    clip_id = str(uuid.uuid4())
    clip_path = os.path.join(UPLOAD_DIR, f"{clip_id}.mp4")
    _save_upload(clip, clip_path)

    db.increment_total_attempts(mission_id)

    try:
        verdict = process_clip(mission_id, mission_label, clip_id, clip_path, criteria=parsed_criteria)
    except WellLogError:
        # 파이프라인 내부(frame_extraction.py 등)에서 이미 명확한 입력 검증 오류로
        # 분류된 경우(예: FILE-001 영상 길이). _save_upload의 FILE-002와 동일하게
        # 순수 입력 거부로 취급한다 - 판정을 시도한 게 아니므로 재촬영 횟수를 차감하지도,
        # ERROR 판정 레코드를 남기지도 않는다. code/http_status는 원래 예외 그대로 나간다.
        purge_clip_assets(clip_id, clip_path)
        raise
    except Exception as e:
        if is_retryable(e):
            db.create_job(
                clip_id, mission_id, mission_label, clip_path,
                max_attempts=retry_budget_for(e),
                criteria_json=criteria,
            )
            return JSONResponse(
                status_code=202,
                content={
                    "clip_id": clip_id,
                    "status": "queued",
                    "message": "일시적인 오류로 판정을 재처리 중입니다. 잠시 후 상태를 확인해주세요.",
                },
            )
        db.increment_retry_count(mission_id)
        # 이 클립은 아직 clips 테이블에 기록되지 않았으므로 파기 스케줄러가 찾지 못한다.
        # 여기서 직접 지우지 않으면 판정 실패한 사용자 영상이 디스크에 영구히 남는다.
        purge_clip_assets(clip_id, clip_path)
        # 파일은 이미 지웠지만, mission_results 조회(12.3절)가 이 판정 시도 자체를
        # 알 수 있도록 verdict="error"로 레코드는 남긴다. 클라이언트에는 그대로 AI-001을 반환한다.
        db.create_clip_record(clip_id, mission_id, clip_path, verdict="error")
        raise AIJudgementFailedError(f"판정 처리 실패: {e}")

    if verdict.verdict == "fail":
        db.increment_retry_count(mission_id)
    elif verdict.verdict == "pass":
        # 통과하면 실패 카운트를 되돌린다(누적된 과거 실패가 다음 인증을 막지 않도록).
        db.reset_retry_count(mission_id)

    # 판정 완료 시점부터 클립 처리 정책(24시간 파기)이 시작된다.
    db.create_clip_record(clip_id, mission_id, clip_path, verdict.verdict)

    return verdict


@app.get("/api/clips/{clip_id}/status", dependencies=[Depends(require_internal_key)])
def get_upload_status(clip_id: str):
    """재처리 큐에 들어간 업로드의 진행 상태를 조회한다.
    큐를 거치지 않고 바로 성공한 클립은 job 레코드가 없을 수 있다."""
    job = db.get_job(clip_id)
    if not job:
        clip = db.get_clip(clip_id)
        if clip:
            return {"clip_id": clip_id, "status": "completed"}
        raise ClipNotFoundError("해당 클립의 처리 이력을 찾을 수 없습니다.")

    result = {
        "clip_id": clip_id,
        "status": job["status"],
        "attempts": job["attempts"],
        "max_attempts": job["max_attempts"],
    }
    if job["status"] == "completed" and job["verdict_json"]:
        result["verdict"] = json.loads(job["verdict_json"])
    if job["status"] == "failed" and job["error_message"]:
        result["error"] = job["error_message"]
    return result


class ShareRequest(BaseModel):
    shared: bool


@app.patch("/api/clips/{clip_id}/share", dependencies=[Depends(require_internal_key)])
def set_share(clip_id: str, body: ShareRequest):
    """사용자가 직접 '공유'를 누른 클립만 그룹에 예외적으로 노출한다.
    공유를 '안 함'으로 명시적으로 선택한 경우에도 호출해야 한다
    (그래야 하이라이트 콜백 유예 없이 즉시 파기된다)."""
    clip = db.get_clip(clip_id)
    if not clip:
        raise ClipNotFoundError("클립을 찾을 수 없습니다.")
    if clip["deleted"]:
        raise ClipAlreadyPurgedError("이미 파기된 클립입니다.")
    db.set_shared(clip_id, body.shared)
    return {"clip_id": clip_id, "shared": body.shared}


@app.post("/api/clips/{clip_id}/highlight-complete", dependencies=[Depends(require_internal_key)])
def notify_highlight_complete(clip_id: str):
    """BE A(하이라이트 자동 생성)가 처리를 마치면 호출하는 콜백.

    비공유 클립은 이 시점에 즉시 파기된다.
    단, 사용자가 아직 공유 여부를 선택하지 않았다면(share_decided=0)
    바로 지우지 않고 유예 시간 뒤 스케줄러가 파기한다.
    -> 사용자가 공유를 누르기 직전에 콜백이 도착해 공유가 영영 불가능해지는 문제 방지.
    """
    clip = db.get_clip(clip_id)
    if not clip:
        raise ClipNotFoundError("클립을 찾을 수 없습니다.")
    if clip["deleted"]:
        return {"clip_id": clip_id, "purged": True, "already_deleted": True}

    db.set_highlight_generated(clip_id)
    clip = db.get_clip(clip_id)  # 갱신된 상태 재조회

    if clip["shared"]:
        return {"clip_id": clip_id, "purged": False, "reason": "shared"}

    if not clip["share_decided"]:
        return {"clip_id": clip_id, "purged": False, "reason": "awaiting_share_decision"}

    if purge_clip_assets(clip_id, clip["file_path"]):
        db.mark_deleted(clip_id)
        return {"clip_id": clip_id, "purged": True}

    return {"clip_id": clip_id, "purged": False, "reason": "purge_failed"}


@app.delete("/api/clips/{clip_id}", dependencies=[Depends(require_internal_key)])
def delete_clip(clip_id: str):
    """사용자가 공유 클립을 직접 삭제한다."""
    clip = db.get_clip(clip_id)
    if not clip:
        raise ClipNotFoundError("클립을 찾을 수 없습니다.")
    if clip["deleted"]:
        return {"clip_id": clip_id, "purged": True, "already_deleted": True}

    if not purge_clip_assets(clip_id, clip["file_path"]):
        raise ClipPurgeFailedError("클립 파기에 실패했습니다.")
    db.mark_deleted(clip_id)
    return {"clip_id": clip_id, "purged": True}


class WithdrawalCleanupRequest(BaseModel):
    userId: int
    withdrawalId: int
    requestedAt: Optional[str] = None


@app.post("/api/ai/clips/withdrawal-cleanup", dependencies=[Depends(require_internal_key)])
def withdrawal_cleanup(body: WithdrawalCleanupRequest):
    """사용자 탈퇴 시 BE C가 호출하는 내부 연동 API (기능명세서 16.4).
    이 사용자의 원본 클립 + 추출 프레임을 지우고 clips.db 레코드를 삭제 처리한다.

    멱등성: 이미 삭제된 클립은 (user_id, deleted=0) 조회에서 자연히 빠지므로
    같은 요청을 여러 번 호출해도 안전하다 — 재호출 시 남은 것만 다시 시도한다.

    스펙은 스토리지 삭제가 지연될 때 202 Accepted + cleanupStatus=PROCESSING로
    비동기 처리하는 경로도 정의하지만, 이 서비스는 로컬 디스크(os.remove)만 다뤄서
    지연될 이유가 없다 - 항상 동기로 즉시 끝나므로 그 경로는 구현하지 않았다.
    나중에 S3 같은 외부 스토리지로 옮기면 그때 필요해질 수 있다.

    응답 형식은 6번 섹션 공통 오류 코드 체계(WellLogError)를 따르지 않는다 —
    이 API는 스펙에서부터 실패 시에도 4번 섹션(공통 성공 응답)과 같은
    {success, data, message} 모양에 success=false만 얹은 자체 포맷을 쓴다.
    """
    if not mission_lookup.USER_ID_LINKING_WIRED:
        # get_mission()이 아직 연결되지 않아 clips.user_id가 전부 NULL이다 (mission_lookup.py 참고).
        # 이 상태에서 NO_CLIPS/COMPLETED를 반환하면 "확인했더니 없음"이 아니라
        # "확인할 방법이 없음"인데도 성공으로 보인다. 스펙의 500 FAILED 계약을 그대로 빌려서
        # BE C가 이 탈퇴를 완료로 확정하지 않고 재시도/운영 확인 대상으로 남기게 만든다.
        print(
            f"[withdrawal-cleanup] user_id 연결 미구현 상태로 호출됨 "
            f"(userId={body.userId}, withdrawalId={body.withdrawalId}) - 실제 클립 삭제 여부를 확인할 수 없음"
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": {
                    "userId": body.userId,
                    "withdrawalId": body.withdrawalId,
                    "cleanupStatus": "FAILED",
                },
                "message": "클립 정리 작업에 실패했습니다. (user_id 연결 미구현 - mission_lookup.get_mission 대기 중)",
            },
        )

    user_id = str(body.userId)
    clips = db.get_active_clips_for_user(user_id)

    if not clips:
        return {
            "success": True,
            "data": {
                "userId": body.userId,
                "withdrawalId": body.withdrawalId,
                "deletedClipCount": 0,
                "deletedFrameCount": 0,
                "cleanupStatus": "NO_CLIPS",
                "idempotent": True,
            },
            "message": "삭제할 클립이 없습니다.",
        }

    deleted_clip_count = 0
    deleted_frame_count = 0
    any_failed = False

    for clip in clips:
        clip_id = clip["clip_id"]
        # 프레임 수를 세야 하므로 purge_clip_assets 대신 두 단계를 직접 호출한다.
        frame_count = cleanup_frames(clip_id, FRAME_DIR)
        if not purge_clip_file(clip["file_path"]):
            any_failed = True
            continue
        db.mark_deleted(clip_id)
        deleted_clip_count += 1
        deleted_frame_count += frame_count

    if any_failed:
        # BE C는 이 응답을 보고 탈퇴 상태를 확정하지 않고 재시도/운영 확인 대상으로 남긴다.
        # 이미 지운 것들은 mark_deleted로 반영했으니, 재호출하면 실패한 것만 다시 시도한다.
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": {
                    "userId": body.userId,
                    "withdrawalId": body.withdrawalId,
                    "cleanupStatus": "FAILED",
                },
                "message": "클립 정리 작업에 실패했습니다.",
            },
        )

    return {
        "success": True,
        "data": {
            "userId": body.userId,
            "withdrawalId": body.withdrawalId,
            "deletedClipCount": deleted_clip_count,
            "deletedFrameCount": deleted_frame_count,
            "cleanupStatus": "COMPLETED",
            "idempotent": False,
        },
        "message": None,
    }


@app.get("/health")
def health():
    """인증 없이 열어둔다 (배포 헬스체크용)."""
    return {"status": "ok"}
