"""
추출된 프레임 + 미션명을 비전 모델(gpt-4o-mini)에 전달해 통과/보류/실패로 분류한다.
판정 '이유 문장'(자연어)은 BE A(판정 근거 생성)가 만들므로,
여기서는 구조화된 결과만 반환한다.
"""
import base64
import json
import os
from typing import List
from openai import OpenAI
from models import VerdictResponse, Criterion

_client = None


def _get_client() -> OpenAI:
    """클라이언트를 최초 호출 시점에 생성한다.
    모듈 import만으로 API 키를 요구하지 않아 테스트/다른 모듈에서 이 파일을 불러오기 쉬워진다."""
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


SYSTEM_PROMPT = """당신은 웰니스 챌린지 인증 사진 판정 시스템입니다.
사용자가 주어진 미션을 실제로 수행했는지 이미지들을 보고 판정하세요.
얼굴이 나오지 않는 각도(손/컵/발/창밖 등)로 촬영된 점을 감안하세요.
반드시 아래 JSON 스키마로만 응답하세요. 다른 텍스트를 포함하지 마세요.

{
  "verdict": "pass" | "hold" | "fail",
  "confidence": 0.0~1.0,
  "criteria": [{"id": "string", "met": true|false}],
  "model_notes": "판정 근거가 될 핵심 관찰 사실 (내부용, 1~2문장)"
}

- pass: 미션 수행이 명확히 확인됨
- hold: 프레임 화질/각도 문제로 판단이 애매함 (재촬영 유도)
- fail: 미션 수행이 확인되지 않음
"""


def judge_mission(mission_label: str, frame_paths: List[str]) -> VerdictResponse:
    content = [{"type": "text", "text": f"미션: {mission_label}"}]
    for path in frame_paths:
        content.append({
            "type": "image_url",
            "image_url": {"url": _to_data_url(path)},
        })

    response = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    parsed = json.loads(response.choices[0].message.content)

    return VerdictResponse(
        mission_id="",  # main.py에서 채워서 최종 응답 구성
        clip_id="",
        verdict=parsed["verdict"],
        confidence=parsed["confidence"],
        criteria=[Criterion(**c) for c in parsed["criteria"]],
        model_notes=parsed["model_notes"],
        processed_at="",
    )


def _to_data_url(path: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"
