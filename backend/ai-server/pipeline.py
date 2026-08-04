"""
클립 -> 프레임 추출 -> 비전 판정까지의 처리 파이프라인.
업로드 요청 경로(main.py)와 재처리 큐(scheduler.py) 양쪽에서 공유해서 쓴다.
로직을 한 곳에만 두어야 나중에 판정 로직이 바뀌어도 두 군데를 따로 안 고쳐도 된다.

중요: 추출된 프레임은 판정 직후 반드시 삭제한다.
프레임은 원본 클립과 별개의 개인정보 파일이므로, 여기서 안 지우면
파기 스케줄러가 원본 mp4만 지우고 사용자 사진은 디스크에 영구히 남는다.
"""
import json
from datetime import datetime, timezone
from typing import List, Optional

import judgment_policy
from exceptions import InvalidCriteriaError
from frame_extraction import extract_frames, cleanup_frames
from vision_judge import judge_mission
from models import VerdictResponse, ClipCriterion

FRAME_DIR = "storage/frames"
FRAME_COUNT = 4


def parse_criteria(raw: Optional[str]) -> Optional[List[ClipCriterion]]:
    """업로드 폼으로 들어온 criteria JSON 문자열을 파싱한다.
    형식: [{"id": "cup_visible", "description": "컵이 화면에 보인다"}, ...]
    필드 자체가 비어 있으면 None (모델이 알아서 criteria를 만드는 기존 동작).
    값이 있는데 JSON이 아니거나 형식이 틀리면 COMMON-002로 실패시킨다
    (예전엔 조용히 None으로 넘어가 사용자가 기준을 지정했다고 착각하게 만들었다)."""
    if not raw:
        return None
    try:
        items = json.loads(raw)
        return [ClipCriterion(**item) for item in items]
    except Exception as e:
        raise InvalidCriteriaError(f"criteria 형식이 올바르지 않습니다: {e}")


def process_clip(
    mission_id: str,
    mission_label: str,
    clip_id: str,
    clip_path: str,
    criteria: Optional[List[ClipCriterion]] = None,
) -> VerdictResponse:
    frame_paths = extract_frames(clip_path, clip_id, FRAME_DIR, count=FRAME_COUNT)
    try:
        raw = judge_mission(mission_label, frame_paths, criteria=criteria)

        final_verdict, confidence, policy_note = judgment_policy.apply(
            raw.verdict,
            raw.confidence,
            raw.criteria,
            criteria_enforced=bool(criteria),
        )

        return VerdictResponse(
            mission_id=mission_id,
            clip_id=clip_id,
            verdict=final_verdict,
            confidence=confidence,
            criteria=raw.criteria,
            model_notes=raw.model_notes,
            processed_at=datetime.now(timezone.utc).isoformat(),
            raw_verdict=raw.verdict,
            policy_version=judgment_policy.POLICY_VERSION,
            policy_note=policy_note or None,
        )
    finally:
        # 성공/실패와 무관하게 프레임은 반드시 사라진다.
        cleanup_frames(clip_id, FRAME_DIR)
