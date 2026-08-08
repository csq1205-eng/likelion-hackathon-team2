"""
frame_extraction.extract_frames()를 '진짜' ffmpeg로 검증한다.
휴대폰 촬영 없이도 ffmpeg의 testsrc(합성 영상 생성기)로 5초 짜리 mp4를 만들어 사용한다.
-> ffmpeg/ffprobe 호출 자체가 이 서버 환경에서 정상 동작하는지 확인하는 데 의미가 있다.

실행: python3 tests/test_frame_extraction.py
"""
import sys
import os
import subprocess
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from frame_extraction import extract_frames
from exceptions import InvalidFileFormatError


def make_synthetic_clip(path: str, duration: float = 5.0):
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"testsrc=duration={duration}:size=320x240:rate=10",
        path,
    ], check=True, capture_output=True)


def test_extract_frames_produces_expected_count_and_valid_jpegs():
    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "sample.mp4")
    make_synthetic_clip(clip_path)

    frame_paths = extract_frames(clip_path, "synthetic-clip", tmp_dir, count=4)

    assert len(frame_paths) == 4
    for p in frame_paths:
        assert os.path.exists(p)
        assert os.path.getsize(p) > 0
        with open(p, "rb") as f:
            header = f.read(2)
        assert header == b"\xff\xd8"  # JPEG 매직 바이트 -> 진짜 이미지 파일이 만들어졌는지 확인


def test_extract_frames_respects_custom_count():
    # duration은 기능명세서 기준 5초 허용 범위(4.5~5.5초) 안이어야 한다 -
    # 이 테스트가 검증하려는 건 frame count 파라미터지 duration 검증이 아니다.
    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "sample.mp4")
    make_synthetic_clip(clip_path, duration=5.0)

    frame_paths = extract_frames(clip_path, "synthetic-clip-2", tmp_dir, count=3)
    assert len(frame_paths) == 3


def test_extract_frames_rejects_duration_outside_tolerance():
    """5초 기준 ±0.5초 허용 오차를 벗어나면 FILE-001(InvalidFileFormatError)로 거부해야 한다."""
    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "too_short.mp4")
    make_synthetic_clip(clip_path, duration=2.0)

    try:
        extract_frames(clip_path, "synthetic-clip-4", tmp_dir, count=4)
    except InvalidFileFormatError:
        pass
    else:
        raise AssertionError("5초 허용 범위를 벗어난 클립은 InvalidFileFormatError를 던져야 한다")


def test_extract_frames_accepts_duration_within_tolerance():
    """정확히 5.000초가 아니어도 허용 오차(±0.5초) 안이면 통과해야 한다."""
    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "slightly_short.mp4")
    make_synthetic_clip(clip_path, duration=4.6)

    frame_paths = extract_frames(clip_path, "synthetic-clip-5", tmp_dir, count=4)
    assert len(frame_paths) == 4


def test_extract_frames_handles_short_clip():
    """실제 미션 클립 스펙(5초)에 가까운 케이스."""
    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "sample_5s.mp4")
    make_synthetic_clip(clip_path, duration=5.0)

    frame_paths = extract_frames(clip_path, "synthetic-clip-3", tmp_dir, count=4)
    assert len(frame_paths) == 4
    for p in frame_paths:
        assert os.path.getsize(p) > 0


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS: {t.__name__}")
    print(f"\n{len(tests)}개 테스트 전부 통과 (실제 ffmpeg 파이프라인 검증)")
