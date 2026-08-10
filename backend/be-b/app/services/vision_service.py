import base64
import json
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.config import settings

_VISION_TIMEOUT_SEC = 30.0


class VisionCriterion(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    met: bool
    description: Optional[str] = Field(default=None, max_length=300)


class VisionVerdict(BaseModel):
    verdict: Literal["PASS", "FAIL", "HOLD"]
    confidence_score: float = Field(ge=0.0, le=100.0)
    criteria: List[VisionCriterion] = Field(default_factory=list)
    model_notes: str = Field(default="", max_length=2000)


class VisionServiceUnavailable(RuntimeError):
    """OPENAI_API_KEY 미설정 등 판정 자체를 시도할 수 없는 상태."""


class VisionServiceCallError(RuntimeError):
    """네트워크 오류, 타임아웃 등 재시도해볼 만한 오류. AI-001 대상."""


def _to_data_url(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{data}"


class VisionService:
    def __init__(self, client=None, model: Optional[str] = None):
        api_key = settings.openai_api_key
        self.client = client or self._build_client(api_key)
        self.model = model or settings.openai_vision_model

    @staticmethod
    def _build_client(api_key: str):
        if not api_key:
            return None
        from openai import OpenAI

        return OpenAI(api_key=api_key, timeout=_VISION_TIMEOUT_SEC, max_retries=0)

    @property
    def available(self) -> bool:
        return self.client is not None

    def judge(
        self,
        frame_paths: List[Path],
        mission_title: Optional[str],
        criteria_hint: Optional[List[dict]] = None,
    ) -> VisionVerdict:
        if not self.client:
            raise VisionServiceUnavailable("OPENAI_API_KEY가 설정되지 않았습니다.")

        context = {
            "mission_title": mission_title,
            "criteria_hint": criteria_hint or [],
        }

        try:
            response = self.client.responses.parse(
                model=self.model,
                instructions=(
                    "당신은 WELLOG의 미션 인증 영상 판정 AI입니다. 사용자가 촬영한 5초 영상에서 "
                    "추출된 연속 프레임들을 보고 미션 수행 여부를 판정하세요. "
                    "criteria_hint가 주어지면 반드시 그 id들로만 criteria를 채우고, 없으면 스스로 "
                    "핵심 판단 기준 1~4개를 영문 소문자와 숫자, 밑줄로만 이루어진 id로 만드세요. "
                    "criteria의 description과 model_notes는 반드시 한국어로 작성하세요. "
                    "명확히 모든 조건이 확인되면 PASS, 명확히 조건이 확인되지 않으면 FAIL, "
                    "프레임만으로 판단하기 애매하면 HOLD를 사용하세요. "
                    "confidence_score는 0~1 사이의 확률이 아니라 0에서 100 사이의 백분율 숫자로 "
                    "표기하세요 (예: 92.5). "
                    "model_notes에는 판정 근거를 내부 검수용으로 간단히 남기되 사용자에게 노출될 "
                    "문장을 만들지 마세요."
                ),
                input=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": json.dumps(context, ensure_ascii=False)},
                            *[
                                {"type": "input_image", "image_url": _to_data_url(path)}
                                for path in frame_paths
                            ],
                        ],
                    }
                ],
                text_format=VisionVerdict,
            )
        except Exception as exc:  # openai SDK/네트워크 오류를 한 종류로 통일해 상위에서 재처리 판단
            raise VisionServiceCallError(str(exc)) from exc

        parsed = response.output_parsed
        if parsed is None:
            raise VisionServiceCallError("AI가 판정 결과를 반환하지 않았습니다.")
        return parsed
