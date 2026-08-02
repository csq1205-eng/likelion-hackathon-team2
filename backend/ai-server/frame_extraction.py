"""
촬영된 클립에서 판정용 프레임을 추출한다.
설계상 프레임 추출은 클라이언트에서 하는 게 원칙(업로드 용량 절감)이지만,
서버단 폴백/검증용으로 동일 로직을 둔다.
"""
import subprocess
import os
from typing import List


def extract_frames(clip_path: str, clip_id: str, out_dir: str, count: int = 4) -> List[str]:
    """clip_path 영상에서 균등한 간격으로 count장의 프레임을 뽑아 out_dir에 저장한다."""
    duration = _get_duration(clip_path)
    interval = duration / (count + 1)

    frame_paths = []
    for i in range(1, count + 1):
        timestamp = interval * i
        out_path = os.path.join(out_dir, f"{clip_id}_{i}.jpg")
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(timestamp),
            "-i", clip_path,
            "-frames:v", "1",
            "-q:v", "2",
            out_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        frame_paths.append(out_path)

    return frame_paths


def _get_duration(clip_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        clip_path,
    ]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return float(result.stdout.strip())
