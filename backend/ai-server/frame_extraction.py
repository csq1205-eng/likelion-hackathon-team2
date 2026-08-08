"""
촬영된 클립에서 판정용 프레임을 추출한다.

현재 구현은 서버 사이드(ffmpeg)다.
클라이언트 사이드 추출(업로드 용량 절감)은 FE와 아직 확정되지 않았으므로,
서버가 원본 클립을 받는다는 전제로 동작한다. (CLAUDE.md '크로스 서비스 계약' 참고)
"""
import glob
import os
import subprocess
from typing import List

from errors import FrameExtractionError
from exceptions import InvalidFileFormatError

# ffmpeg/ffprobe가 응답 없이 매달리는 걸 막는다. 손상된 파일 하나로 요청이 무한정 잡히면 안 됨.
FFMPEG_TIMEOUT_SEC = 30

# 판정에 필요한 최소 해상도까지만 줄인다.
# 휴대폰 원본(1080p/4K) 프레임을 그대로 base64로 보내면 지연/비용이 몇 배로 뛴다.
FRAME_MAX_WIDTH = 768

# 기능명세서 12.1: "원본 클립 영상 길이는 5초"가 기준. 실제 촬영본은 인코딩/컨테이너
# 오차로 정확히 5.000초가 나오는 경우가 거의 없어서 ±0.5초 허용 오차를 둔다.
MIN_CLIP_DURATION_SEC = 4.5
MAX_CLIP_DURATION_SEC = 5.5


def extract_frames(clip_path: str, clip_id: str, out_dir: str, count: int = 4) -> List[str]:
    """clip_path 영상에서 균등한 간격으로 count장의 프레임을 뽑아 out_dir에 저장한다."""
    os.makedirs(out_dir, exist_ok=True)

    duration = _get_duration(clip_path)
    interval = duration / (count + 1)

    frame_paths: List[str] = []
    try:
        for i in range(1, count + 1):
            timestamp = interval * i
            out_path = os.path.join(out_dir, f"{clip_id}_{i}.jpg")
            cmd = [
                "ffmpeg", "-y",
                "-ss", f"{timestamp:.3f}",
                "-i", clip_path,
                "-frames:v", "1",
                # 가로 FRAME_MAX_WIDTH 초과일 때만 축소(확대는 하지 않음), 세로는 비율 유지 + 짝수 보정
                "-vf", f"scale='min({FRAME_MAX_WIDTH},iw)':-2",
                "-q:v", "3",
                out_path,
            ]
            _run(cmd)
            if not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
                raise FrameExtractionError(f"프레임 {i} 추출 결과가 비어 있습니다.")
            frame_paths.append(out_path)
    except Exception:
        # 중간에 실패하면 이미 만들어진 프레임도 남기지 않는다.
        cleanup_frames(clip_id, out_dir)
        raise

    return frame_paths


def cleanup_frames(clip_id: str, out_dir: str) -> int:
    """해당 클립에서 추출된 프레임 이미지를 전부 삭제한다.

    프레임은 원본 클립과 별개의 개인정보이므로, 판정이 끝나면 즉시 사라져야 한다.
    (파기 스케줄러의 안전망에서도 다시 호출된다)
    """
    removed = 0
    for path in glob.glob(os.path.join(out_dir, f"{clip_id}_*.jpg")):
        try:
            os.remove(path)
            removed += 1
        except OSError:
            pass
    return removed


def _get_duration(clip_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        clip_path,
    ]
    result = _run(cmd, text=True)
    raw = (result.stdout or "").strip()
    try:
        duration = float(raw)
    except ValueError:
        raise FrameExtractionError(f"영상 길이를 읽을 수 없습니다. (ffprobe 출력: {raw!r})")

    if duration <= 0 or duration != duration:  # 0 이하 또는 NaN
        raise FrameExtractionError(f"유효하지 않은 영상 길이입니다: {duration}")

    if not (MIN_CLIP_DURATION_SEC <= duration <= MAX_CLIP_DURATION_SEC):
        raise InvalidFileFormatError(
            f"미션 인증 클립은 5초 촬영만 허용합니다 "
            f"(허용 범위 {MIN_CLIP_DURATION_SEC}~{MAX_CLIP_DURATION_SEC}초, 업로드된 영상: {duration:.2f}초)"
        )

    return duration


def _run(cmd, text: bool = False):
    """ffmpeg/ffprobe 호출을 감싸서, 실패를 전부 FrameExtractionError(재시도 불가)로 변환한다."""
    try:
        return subprocess.run(
            cmd, check=True, capture_output=True, text=text, timeout=FFMPEG_TIMEOUT_SEC
        )
    except FileNotFoundError:
        raise FrameExtractionError("ffmpeg/ffprobe가 설치되어 있지 않습니다. (brew install ffmpeg / apt install ffmpeg)")
    except subprocess.TimeoutExpired:
        raise FrameExtractionError(f"프레임 추출이 {FFMPEG_TIMEOUT_SEC}초를 초과했습니다.")
    except subprocess.CalledProcessError as e:
        stderr = e.stderr
        if isinstance(stderr, bytes):
            stderr = stderr.decode("utf-8", errors="replace")
        snippet = (stderr or "").strip().splitlines()[-1:] or [""]
        raise FrameExtractionError(f"영상을 처리할 수 없습니다: {snippet[0][:200]}")
