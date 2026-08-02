r"""
실제 OpenAI API로 vision_judge.judge_mission()이 정상적으로 동작하는지 확인하는
'수동' 스모크 테스트. tests/ 폴더의 나머지 테스트와 달리 진짜 API 키와 네트워크가 필요하다.

목적: 정확도 검증이 아니라 "연동 자체가 살아있는지" 확인.
      (합성 영상이라 실제 미션 판정 결과 자체는 의미 없음 -- fail/hold가 나와도 정상)
      정확도 검증은 나중에 실제 클립으로 모은 평가셋(~65개)으로 진행할 것.

실행:
  # bash / macOS / Linux
  export OPENAI_API_KEY=sk-...
  python3 scripts/live_smoke_test.py

  # PowerShell (Windows)
  $env:OPENAI_API_KEY = "sk-..."
  python scripts\live_smoke_test.py

  # 또는 .env 파일에 OPENAI_API_KEY를 넣어두면 위 export/$env: 없이 자동으로 읽힘
"""
import sys
import os
import subprocess
import tempfile

from dotenv import load_dotenv
load_dotenv(encoding="utf-8-sig")  # .env 파일을 읽어서 환경변수로 자동 등록 (Windows BOM 대응)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from frame_extraction import extract_frames
from vision_judge import judge_mission


def make_synthetic_clip(path: str, duration: float = 5.0):
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"testsrc=duration={duration}:size=320x240:rate=10",
        path,
    ], check=True, capture_output=True)


def main():
    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY가 설정되어 있지 않습니다.")
        print("먼저 실행하세요: export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    tmp_dir = tempfile.mkdtemp()
    clip_path = os.path.join(tmp_dir, "smoke.mp4")

    print("1. 합성 테스트 영상 생성 중...")
    make_synthetic_clip(clip_path)

    print("2. 프레임 추출 중 (실제 ffmpeg)...")
    frame_paths = extract_frames(clip_path, "smoke-test", tmp_dir, count=4)
    print(f"   -> {len(frame_paths)}개 프레임 추출 완료")

    print("3. gpt-4o-mini에 판정 요청 중 (실제 OpenAI API 호출, 약간의 크레딧 사용됨)...")
    verdict = judge_mission("물 한 잔 마시기", frame_paths)

    print("\n=== 응답 ===")
    print(f"verdict:      {verdict.verdict}")
    print(f"confidence:   {verdict.confidence}")
    print(f"criteria:     {verdict.criteria}")
    print(f"model_notes:  {verdict.model_notes}")

    assert verdict.verdict in ("pass", "hold", "fail"), "verdict 값이 스키마를 벗어남"
    assert 0.0 <= verdict.confidence <= 1.0, "confidence가 0~1 범위를 벗어남"
    assert len(verdict.criteria) > 0, "criteria가 비어있음"
    assert verdict.model_notes.strip() != "", "model_notes가 비어있음"

    print("\n✅ 연동 정상 동작 확인 (요청/응답 스키마 검증 통과)")
    print("   ※ 합성 영상이라 verdict 자체의 정확도는 의미 없습니다.")
    print("   다음 단계: 실제 휴대폰 촬영본으로 한 번 더 확인 -> 이후 평가셋(~65개)으로 정확도 검증")


if __name__ == "__main__":
    main()
