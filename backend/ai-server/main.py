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
"""
import os
import shutil
import uuid
import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv(encoding="utf-8-sig")  # .env 파일을 읽어서 환경변수로 자동 등록 (Windows BOM 대응)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import db
from pipeline import process_clip
from errors import is_retryable
from retention_policy import purge_clip_file
from scheduler import start_scheduler, stop_scheduler

UPLOAD_DIR = "storage/clips"
FRAME_DIR = "storage/frames"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FRAME_DIR, exist_ok=True)

MAX_MISSION_RETRIES = 3  # 사용자가 한 미션당 재촬영할 수 있는 최대 횟수


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Welllog BE B - Media & Vision Pipeline", lifespan=lifespan)


@app.post("/api/clips/upload")
async def upload_clip(
    mission_id: str = Form(...),
    mission_label: str = Form(...),
    clip: UploadFile = File(...),
):
    """
    1. 클립 업로드
    2. 프레임 3~5장 추출
    3. 비전 모델 판정
    4. 판정 결과 반환 (BE A가 이 결과로 판정 근거 문장을 생성)

    네트워크성 오류(OpenAI 연결 끊김/타임아웃/레이트리밋)가 나면
    사용자 재촬영 횟수는 차감하지 않고 재처리 큐에 넣은 뒤 202를 반환한다.
    그 외 오류(예: 손상된 파일)는 재시도해도 의미 없으므로 즉시 실패 처리한다.
    """
    if db.get_retry_count(mission_id) >= MAX_MISSION_RETRIES:
        raise HTTPException(status_code=429, detail="재촬영 횟수를 초과했습니다.")

    clip_id = str(uuid.uuid4())
    clip_path = os.path.join(UPLOAD_DIR, f"{clip_id}.mp4")
    with open(clip_path, "wb") as f:
        shutil.copyfileobj(clip.file, f)

    try:
        verdict = process_clip(mission_id, mission_label, clip_id, clip_path)
    except Exception as e:
        if is_retryable(e):
            db.create_job(clip_id, mission_id, mission_label, clip_path)
            return JSONResponse(
                status_code=202,
                content={
                    "clip_id": clip_id,
                    "status": "queued",
                    "message": "일시적인 오류로 판정을 재처리 중입니다. 잠시 후 상태를 확인해주세요.",
                },
            )
        db.increment_retry_count(mission_id)
        raise HTTPException(status_code=422, detail=f"판정 처리 실패: {e}")

    if verdict.verdict == "fail":
        db.increment_retry_count(mission_id)

    # 판정 완료 시점부터 클립 처리 정책(24시간 파기)이 시작된다.
    db.create_clip_record(clip_id, mission_id, clip_path)

    return verdict


@app.get("/api/clips/{clip_id}/status")
async def get_upload_status(clip_id: str):
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


@app.patch("/api/clips/{clip_id}/share")
async def set_share(clip_id: str, body: ShareRequest):
    """사용자가 직접 '공유'를 누른 클립만 그룹에 예외적으로 노출한다."""
    clip = db.get_clip(clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")
    db.set_shared(clip_id, body.shared)
    return {"clip_id": clip_id, "shared": body.shared}


@app.post("/api/clips/{clip_id}/highlight-complete")
async def notify_highlight_complete(clip_id: str):
    """BE A(하이라이트 자동 생성)가 처리를 마치면 호출하는 콜백.
    비공유 클립은 이 시점에 즉시 파기된다."""
    clip = db.get_clip(clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")

    db.set_highlight_generated(clip_id)
    clip = db.get_clip(clip_id)  # 갱신된 상태 재조회

    if not clip["shared"]:
        purge_clip_file(clip["file_path"])
        db.mark_deleted(clip_id)
        return {"clip_id": clip_id, "purged": True}

    return {"clip_id": clip_id, "purged": False}


@app.delete("/api/clips/{clip_id}")
async def delete_clip(clip_id: str):
    """사용자가 공유 클립을 직접 삭제한다."""
    clip = db.get_clip(clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="클립을 찾을 수 없습니다.")
    purge_clip_file(clip["file_path"])
    db.mark_deleted(clip_id)
    return {"clip_id": clip_id, "purged": True}


@app.get("/health")
async def health():
    return {"status": "ok"}
