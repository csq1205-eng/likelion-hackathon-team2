import shutil
import subprocess
from pathlib import Path
from typing import List

_FFMPEG_TIMEOUT_SEC = 30
_FFPROBE_TIMEOUT_SEC = 30
MIN_FRAMES = 3
MAX_FRAMES = 5


class FrameExtractionError(RuntimeError):
    """손상된 파일 등 재시도해도 의미 없는 오류. 사용자 재촬영 유도 대상."""


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


def _probe_duration_seconds(clip_path: Path) -> float:
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(clip_path),
            ],
            capture_output=True, text=True, timeout=_FFPROBE_TIMEOUT_SEC, check=True,
        )
        duration = float(result.stdout.strip())
        if duration <= 0:
            raise FrameExtractionError("영상 길이를 확인할 수 없습니다.")
        return duration
    except (subprocess.SubprocessError, ValueError) as exc:
        raise FrameExtractionError(f"영상 길이를 확인하지 못했습니다: {exc}") from exc


def extract_frames(clip_path: Path, save_frame, frame_count: int = 4) -> int:
    """클립에서 프레임을 균등 추출하고 save_frame(frame_order, tmp_path)로 저장을 위임한다.

    반환값은 실제로 추출된 프레임 수(3~5). ffmpeg/ffprobe가 없으면 FrameExtractionError.
    """
    if not ffmpeg_available():
        raise FrameExtractionError("ffmpeg/ffprobe를 찾을 수 없습니다.")

    frame_count = max(MIN_FRAMES, min(MAX_FRAMES, frame_count))
    duration = _probe_duration_seconds(clip_path)

    # 처음/끝 프레임이 검은 화면일 가능성을 줄이기 위해 5%~95% 구간에서 균등 추출.
    margin = duration * 0.05
    usable = max(duration - 2 * margin, 0.1)
    timestamps = [margin + usable * i / max(frame_count - 1, 1) for i in range(frame_count)]

    extracted = 0
    for order, timestamp in enumerate(timestamps, start=1):
        tmp_path = clip_path.with_suffix(f".frame{order}.jpg")
        try:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-ss", f"{timestamp:.3f}", "-i", str(clip_path),
                    "-frames:v", "1", "-vf", "scale=768:-2",
                    str(tmp_path),
                ],
                capture_output=True, timeout=_FFMPEG_TIMEOUT_SEC, check=True,
            )
        except subprocess.SubprocessError as exc:
            raise FrameExtractionError(f"프레임 추출에 실패했습니다: {exc}") from exc

        if not tmp_path.exists() or tmp_path.stat().st_size == 0:
            tmp_path.unlink(missing_ok=True)
            continue

        save_frame(order, tmp_path)
        tmp_path.unlink(missing_ok=True)
        extracted += 1

    if extracted < MIN_FRAMES:
        raise FrameExtractionError("최소 프레임 수를 추출하지 못했습니다.")

    return extracted
