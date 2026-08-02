"""
클립 -> 프레임 추출 -> 비전 판정까지의 처리 파이프라인.
업로드 요청 경로(main.py)와 재처리 큐(scheduler.py) 양쪽에서 공유해서 쓴다.
로직을 한 곳에만 두어야 나중에 판정 로직이 바뀌어도 두 군데를 따로 안 고쳐도 된다.
"""
from datetime import datetime, timezone

from frame_extraction import extract_frames
from vision_judge import judge_mission
from models import VerdictResponse

FRAME_DIR = "storage/frames"


def process_clip(mission_id: str, mission_label: str, clip_id: str, clip_path: str) -> VerdictResponse:
    frame_paths = extract_frames(clip_path, clip_id, FRAME_DIR, count=4)
    verdict = judge_mission(mission_label, frame_paths)
    return VerdictResponse(
        mission_id=mission_id,
        clip_id=clip_id,
        verdict=verdict.verdict,
        confidence=verdict.confidence,
        criteria=verdict.criteria,
        model_notes=verdict.model_notes,
        processed_at=datetime.now(timezone.utc).isoformat(),
    )
