import json
import os
from typing import List, Optional

from openai import OpenAI
from pydantic import BaseModel, Field

from app.schemas.mission import Mission, MissionGenerateRequest
from app.schemas.report import PersonalWeeklyReportRequest, WeeklyReportRequest
from app.schemas.verdict import VerdictReasonRequest


class GeneratedMissionSet(BaseModel):
    missions: List[Mission] = Field(min_length=1, max_length=3)


class GeneratedVerdictReason(BaseModel):
    user_message: str = Field(min_length=1, max_length=500)


class GeneratedWeeklyReport(BaseModel):
    summary_text: str = Field(min_length=1, max_length=500)
    encouragement_text: str = Field(min_length=1, max_length=300)


class LLMConfigurationError(RuntimeError):
    pass


class LLMService:
    def __init__(self, client=None, model: Optional[str] = None):
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        timeout_seconds = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "15"))
        self.client = client or (
            OpenAI(
                api_key=api_key,
                timeout=timeout_seconds,
                max_retries=0,
            )
            if api_key
            else None
        )
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-5.6-sol")

    @property
    def available(self) -> bool:
        return self.client is not None

    def generate_missions(
        self,
        request: MissionGenerateRequest,
        safety_constraints: List[str],
    ) -> List[Mission]:
        if not self.client:
            raise LLMConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")

        user_context = {
            "goal": request.goal,
            "profile": request.profile.model_dump(),
            "environment": request.environment.model_dump(),
            "excluded_missions": request.excluded_missions,
            "max_missions": request.max_missions,
            "safety_constraints": safety_constraints,
        }

        response = self.client.responses.parse(
            model=self.model,
            instructions=(
                "당신은 WELLOG의 웰니스 미션 설계자입니다. 사용자 목표와 프로필을 분석해 "
                "오늘 직접 수행할 수 있는 개인화 미션을 만드세요. 의료 진단, 치료, 약물·건강기능식품 "
                "추천은 금지합니다. 각 미션은 5초 내외 영상에서 물체나 행동으로 판정 가능해야 합니다. "
                "전체 수행 과정을 5초 안에 촬영하도록 요구하지 말고, 핵심 물체와 한 가지 행동이 짧은 "
                "영상에서 확인되는 기준을 서로 분리해 작성하세요. mission_type과 slot은 제공된 enum만 "
                "사용하세요. "
                "추상적인 목표 대신 하나의 구체적인 행동을 작성하세요. safety_constraints와 제외 목록을 "
                "반드시 지키고, 아침·낮·저녁 시간대가 가능한 한 겹치지 않게 하세요. 추천 이유에는 "
                "사용자의 민감한 정보를 과도하게 노출하지 말고 목표나 환경과 연결된 한 문장을 쓰세요. "
                "verification_criteria.id는 영문 소문자와 숫자, 밑줄만 사용하세요."
            ),
            input=json.dumps(user_context, ensure_ascii=False),
            text_format=GeneratedMissionSet,
        )

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("AI가 미션 결과를 반환하지 않았습니다.")
        return parsed.missions[: request.max_missions]

    def generate_verdict_reason(self, request: VerdictReasonRequest) -> str:
        if not self.client:
            raise LLMConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")

        verdict_context = {
            "mission_title": request.mission_title,
            "verdict": request.verdict,
            "confidenceScore": request.confidence_score,
            "criteria": [criterion.model_dump() for criterion in request.criteria],
            "model_notes": request.model_notes,
        }

        response = self.client.responses.parse(
            model=self.model,
            instructions=(
                "당신은 WELLOG의 영상 인증 결과 안내 도우미입니다. 입력된 판정 결과를 바꾸지 말고 "
                "사용자에게 보여줄 자연스러운 한국어 문장 한두 개를 작성하세요. PASS는 인증 완료를 "
                "축하하고, FAIL은 확인되지 않은 조건과 다음 촬영 방법을 비난하지 않는 말투로 안내하세요. "
                "HOLD는 현재 영상만으로 판정하기 어려웠던 조건과 재촬영 방법을 안내하세요. "
                "ERROR는 사용자 책임이 아닌 시스템 문제이며 잠시 후 다시 시도하도록 안내하세요. "
                "model_notes는 내부 참고용이므로 "
                "원문, 모델명, 확률, 내부 용어를 그대로 노출하지 마세요. 입력에 없는 사실을 만들지 마세요."
            ),
            input=json.dumps(verdict_context, ensure_ascii=False),
            text_format=GeneratedVerdictReason,
        )

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("AI가 판정 이유를 반환하지 않았습니다.")
        return parsed.user_message

    def generate_weekly_report(self, request: WeeklyReportRequest) -> GeneratedWeeklyReport:
        if not self.client:
            raise LLMConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")

        report_context = request.model_dump(mode="json", by_alias=True)
        response = self.client.responses.parse(
            model=self.model,
            instructions=(
                "당신은 WELLOG 친구 그룹의 주간 웰니스 리포트 작성자입니다. 제공된 집계값을 "
                "다시 계산하거나 변경하지 말고, summary_text와 encouragement_text를 자연스러운 한국어로 "
                "작성하세요. 개인 간 순위를 만들거나 특정 구성원을 비난하지 마세요. 완료하지 못한 날을 "
                "실패로 단정하지 말고 다음 주에 실천 가능한 따뜻한 응원을 제공하세요. 의료 진단이나 "
                "치료 조언을 하지 말고, 입력에 없는 사실을 만들지 마세요."
            ),
            input=json.dumps(report_context, ensure_ascii=False),
            text_format=GeneratedWeeklyReport,
        )

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("AI가 주간 리포트를 반환하지 않았습니다.")
        return parsed

    def generate_personal_weekly_report(
        self,
        request: PersonalWeeklyReportRequest,
    ) -> GeneratedWeeklyReport:
        if not self.client:
            raise LLMConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")

        report_context = request.model_dump(mode="json", by_alias=True)
        response = self.client.responses.parse(
            model=self.model,
            instructions=(
                "당신은 WEDIT 사용자의 개인 주간 웰니스 리포트 작성자입니다. 제공된 집계값을 "
                "다시 계산하거나 변경하지 말고, summary_text와 encouragement_text를 자연스러운 "
                "한국어로 작성하세요. 날짜별·미션 유형별·시간대별 통계에서 실제로 확인되는 패턴만 "
                "간단히 언급하세요. 실패나 미제출을 사용자의 잘못으로 비난하지 말고 다음 주에 "
                "실천 가능한 따뜻한 제안을 제공하세요. 의료 진단이나 치료 조언을 하지 말고, "
                "입력에 없는 사실을 만들지 마세요."
            ),
            input=json.dumps(report_context, ensure_ascii=False),
            text_format=GeneratedWeeklyReport,
        )

        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError("AI가 개인 주간 리포트를 반환하지 않았습니다.")
        return parsed
