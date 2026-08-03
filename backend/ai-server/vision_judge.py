"""
추출된 프레임 + 미션명을 비전 모델에 전달해 통과/보류/실패로 분류한다.
판정 '이유 문장'(자연어)은 BE A(판정 근거 생성)가 만들므로,
여기서는 구조화된 결과만 반환한다.

임계값 적용(confidence 컷 등)은 여기가 아니라 judgment_policy.py에서 한다.
이 파일은 '모델이 뭐라고 했는지'만 책임진다.
"""
import base64
import json
import os
from typing import List, Optional

import openai
from openai import OpenAI
from pydantic import ValidationError

from errors import VerdictParseError
from models import VerdictResponse, Criterion, ClipCriterion

MODEL = os.environ.get("VISION_MODEL", "gpt-4o-mini")

# OpenAI SDK 기본 타임아웃은 600초라 요청 하나가 10분간 매달릴 수 있다. 명시적으로 낮춘다.
REQUEST_TIMEOUT_SEC = float(os.environ.get("VISION_TIMEOUT_SEC", "30"))

# "low"로 두면 이미지 토큰이 크게 줄어든다(비용 절감). 정확도 영향은 평가셋으로 비교할 것.
IMAGE_DETAIL = os.environ.get("VISION_IMAGE_DETAIL", "auto")

_client: Optional[OpenAI] = None
_use_json_schema = True  # 모델이 structured outputs를 거부하면 json_object로 자동 폴백

VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "verdict": {"type": "string", "enum": ["pass", "hold", "fail"]},
        "confidence": {"type": "number"},
        "criteria": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "met": {"type": "boolean"},
                },
                "required": ["id", "met"],
                "additionalProperties": False,
            },
        },
        "model_notes": {"type": "string"},
    },
    "required": ["verdict", "confidence", "criteria", "model_notes"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """당신은 웰니스 챌린지 인증 사진 판정 시스템입니다.
사용자가 주어진 미션을 실제로 수행했는지 이미지들을 보고 판정하세요.
얼굴이 나오지 않는 각도(손/컵/발/창밖 등)로 촬영된 점을 감안하세요.

- pass: 미션 수행이 명확히 확인됨
- hold: 프레임 화질/각도 문제로 판단이 애매함 (재촬영 유도)
- fail: 미션 수행이 확인되지 않음

confidence는 0.0~1.0 사이의 값으로, 판정에 대한 확신 정도를 정직하게 매기세요.
애매하면 낮은 값을 쓰세요. 확신이 없는데 높은 값을 매기지 마세요.
model_notes에는 판정 근거가 될 핵심 관찰 사실만 1~2문장으로 적으세요 (내부용).
반드시 지정된 JSON 스키마로만 응답하고, 다른 텍스트는 포함하지 마세요."""

CRITERIA_INSTRUCTION = """아래 판정 기준 목록이 주어집니다.
criteria 배열에는 **주어진 id를 그대로** 사용해 각 기준의 충족 여부만 채우세요.
새로운 id를 만들거나 목록에 없는 항목을 추가하지 마세요."""

FREEFORM_CRITERIA_INSTRUCTION = """판정 기준이 따로 주어지지 않았습니다.
criteria에는 이번 판정에서 확인한 관찰 항목을 스스로 정해 넣으세요."""


def _get_client() -> OpenAI:
    """클라이언트를 최초 호출 시점에 생성한다.
    모듈 import만으로 API 키를 요구하지 않아 테스트/다른 모듈에서 이 파일을 불러오기 쉬워진다."""
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.environ.get("OPENAI_API_KEY"),
            timeout=REQUEST_TIMEOUT_SEC,
            max_retries=0,  # 재시도는 우리 재처리 큐가 책임진다. SDK가 몰래 중복 과금하지 않도록.
        )
    return _client


def judge_mission(
    mission_label: str,
    frame_paths: List[str],
    criteria: Optional[List[ClipCriterion]] = None,
) -> VerdictResponse:
    global _use_json_schema

    user_text = f"미션: {mission_label}\n\n"
    if criteria:
        user_text += CRITERIA_INSTRUCTION + "\n\n판정 기준:\n"
        user_text += "\n".join(f"- {c.id}: {c.description}" for c in criteria)
    else:
        user_text += FREEFORM_CRITERIA_INSTRUCTION

    content = [{"type": "text", "text": user_text}]
    for path in frame_paths:
        content.append({
            "type": "image_url",
            "image_url": {"url": _to_data_url(path), "detail": IMAGE_DETAIL},
        })

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]

    try:
        response = _create(messages, use_schema=_use_json_schema)
    except openai.BadRequestError as e:
        # 모델/버전이 structured outputs를 지원하지 않는 경우에만 1회 폴백하고 이후엔 계속 json_object 사용
        if _use_json_schema and "json_schema" in str(e).lower():
            _use_json_schema = False
            response = _create(messages, use_schema=False)
        else:
            raise

    raw = response.choices[0].message.content
    return _parse(raw)


def _create(messages, use_schema: bool):
    if use_schema:
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "wellness_verdict",
                "strict": True,
                "schema": VERDICT_SCHEMA,
            },
        }
    else:
        response_format = {"type": "json_object"}

    return _get_client().chat.completions.create(
        model=MODEL,
        messages=messages,
        response_format=response_format,
        temperature=0,
    )


def _parse(raw: Optional[str]) -> VerdictResponse:
    """모델 응답을 파싱한다. 스키마를 어기면 VerdictParseError(재시도 가능)로 올린다.

    이걸 그냥 KeyError로 터뜨리면 '재시도 불가 오류'로 분류돼
    사용자 잘못이 아닌데 재촬영 횟수가 차감된다.
    """
    if not raw:
        raise VerdictParseError("모델 응답이 비어 있습니다.")

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        raise VerdictParseError(f"모델 응답이 JSON이 아닙니다: {e}")

    if not isinstance(parsed, dict):
        raise VerdictParseError("모델 응답이 객체가 아닙니다.")

    verdict = str(parsed.get("verdict", "")).strip().lower()
    if verdict not in ("pass", "hold", "fail"):
        raise VerdictParseError(f"허용되지 않은 verdict 값: {parsed.get('verdict')!r}")

    try:
        confidence = float(parsed.get("confidence", 0.0))
    except (TypeError, ValueError):
        raise VerdictParseError(f"confidence를 숫자로 변환할 수 없습니다: {parsed.get('confidence')!r}")

    raw_criteria = parsed.get("criteria") or []
    if not isinstance(raw_criteria, list):
        raise VerdictParseError("criteria가 배열이 아닙니다.")

    try:
        criteria = [Criterion(id=str(c["id"]), met=bool(c["met"])) for c in raw_criteria]
    except (KeyError, TypeError, ValidationError) as e:
        raise VerdictParseError(f"criteria 형식이 잘못되었습니다: {e}")

    return VerdictResponse(
        mission_id="",  # pipeline.py에서 채워서 최종 응답 구성
        clip_id="",
        verdict=verdict,
        confidence=confidence,
        criteria=criteria,
        model_notes=str(parsed.get("model_notes", "")),
        processed_at="",
        raw_verdict=verdict,
    )


def _to_data_url(path: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"
