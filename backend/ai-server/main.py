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

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager

import db
from db import MAX_TOTAL_ATTEMPTS
from pipeline import process_clip, parse_criteria
from errors import is_retryable, retry_budget_for
from retention_policy import purge_clip_assets
from scheduler import start_scheduler, stop_scheduler

UPLOAD_DIR = "storage/clips"
FRAME_DIR = "storage/frames"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAME_DIR, exist_ok=True)

MAX_MISSION_RETRIES = 3        # 판정 'fail'로 소진되는 재촬영 횟수
# MAX_TOTAL_ATTEMPTS는 db.py에 정의 (scheduler.py의 재처리 큐도 같은 값을 참조해야 함)
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

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
        raise HTTPException(status_code=401, detail="유효하지 않은 내부 인증 키입니다.")


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
                raise HTTPException(
                    status_code=413,
                    detail=f"클립 용량이 너무 큽니다. (최대 {MAX_UPLOAD_MB}MB)",
                )
            f.write(chunk)
    if size == 0:
        purge_clip_assets("", clip_path)
        raise HTTPException(status_code=400, detail="빈 파일입니다.")


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

    네트워크성 오류(OpenAI 연결 끊김/타임아웃/레이트리밋)나 모델 스키마 위반은
    사용자 재촬영 횟수를 차감하지 않고 재처리 큐에 넣은 뒤 202를 반환한다.
    그 외 오류(예: 손상된 파일)는 재시도해도 의미 없으므로 즉시 실패 처리한다.
    """
    if db.get_retry_count(mission_id) >= MAX_MISSION_RETRIES:
        raise HTTPException(status_code=429, detail="재촬영 횟수를 초과했습니다.")
    if db.get_total_attempts(mission_id) >= MAX_TOTAL_ATTEMPTS:
        raise HTTPException(status_code=429, detail="이 미션의 인증 시도 한도를 초과했습니다.")

    clip_id = str(uuid.uuid4())
    clip_path = os.path.join(UPLOAD_DIR, f"{clip_id}.mp4")
    _save_upload(clip, clip_path)

    db.increment_total_attempts(mission_id)
    parsed_criteria = parse_criteria(criteria)

    try:
        verdict = process_clip(mission_id, mission_label, clip_id, clip_path, criteria=parsed_criteria)
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
        # 이 클립은 clips 테이블에 기록되지 않으므로 파기 스케줄러가 찾지 못한다.
        # 여기서 직접 지우지 않으면 판정 실패한 사용자 영상이 디스크에 영구히 남는다.
        purge_clip_assets(clip_id, clip_path)
        raise HTTPException(status_code=422, detail=f"판정 처리 실패: {e}")

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
        raise HTTPException(status_code=404, detail="해당 클립의 처리 이력을 찾을 수 없습니다.")

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
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")
    if clip["deleted"]:
        raise HTTPException(status_code=410, detail="이미 파기된 클립입니다.")
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
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")
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
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")
    if clip["deleted"]:
        return {"clip_id": clip_id, "purged": True, "already_deleted": True}

    if not purge_clip_assets(clip_id, clip["file_path"]):
        raise HTTPException(status_code=500, detail="클립 파기에 실패했습니다.")
    db.mark_deleted(clip_id)
    return {"clip_id": clip_id, "purged": True}


@app.get("/health")
def health():
    """인증 없이 열어둔다 (배포 헬스체크용)."""
    return {"status": "ok"}
