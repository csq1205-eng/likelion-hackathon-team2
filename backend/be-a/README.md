# WELLOG BE A

WELLOG의 **AI 개인별 미션 생성 + 추천 이유 + 안전/제외 필터**를 구현한 FastAPI MVP입니다.
OpenAI Structured Outputs로 미션을 생성하고, API 키가 없거나 AI 호출이 실패하면 안전한 기본 미션 카탈로그로 자동 전환합니다.

## 구현 기능

- 사용자 피부 타입·고민·목표 반영
- 날씨·자외선·미세먼지 반영
- 미션 하루 최대 3개 제한
- 통증 및 사용자 제외 미션 필터링
- 아침·낮·저녁 시간대 분산
- 각 미션의 추천 이유와 영상 인증 기준 반환
- OpenAI API를 이용한 사용자 맞춤 미션 생성
- AI 호출 실패 또는 안전 검증 실패 시 규칙 기반 미션 자동 대체
- BE B 판정 결과를 사용자용 문장으로 변환 (`PASS / FAIL / HOLD / ERROR`)
- OpenAI로 판정 이유를 자연스럽게 생성하고 실패 시 규칙 문장으로 자동 대체
- 하이라이트 저장 성공 후 각 클립의 BE B 완료 콜백 호출

## 실행

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

- Swagger UI: http://127.0.0.1:8001/docs
- 상태 확인: http://127.0.0.1:8001/health

`.env.example`을 복사한 `.env` 또는 실행 환경에 `OPENAI_API_KEY`, `BE_B_BASE_URL`, `INTERNAL_API_KEY`를 설정하세요.

```bash
export OPENAI_API_KEY="발급받은 키"
export OPENAI_MODEL="gpt-5.6-sol"
```

API JSON은 최종 명세서에 맞춰 `camelCase`를 사용하며, Python 코드 내부에서는 `snake_case`를 사용합니다.
응답의 `generationMode`가 `ai`이면 AI 생성, `fallback`이면 기본 미션으로 대체된 결과입니다.

판정 이유 응답의 `reasonSource`는 `AI` 또는 `FALLBACK`입니다.

## API

`POST /api/ai/missions/generate`

추가 API:

- `POST /api/ai/verdicts/reason`: 내부 판정 결과를 사용자용 문장으로 변환
- `POST /api/ai/highlights/complete`: 저장이 끝난 하이라이트의 각 클립에 대해 BE B 콜백 호출

판정 이유 요청 예시:

```json
{
  "missionId": 100,
  "clipId": 200,
  "verdict": "FAIL",
  "confidenceScore": 72.0,
  "criteria": [
    {"id": "product_visible", "met": true},
    {"id": "application_action", "met": false}
  ],
  "modelNotes": "Product was visible, but the application action was unclear.",
  "processedAt": "2026-08-03T12:30:00Z"
}
```

최종 판정값은 API 명세서에 따라 `PASS`, `FAIL`, `HOLD`, `ERROR`를 사용합니다. `HOLD`는 판정 보류로
재촬영 실패 횟수에 포함하지 않습니다. 판정 처리가 아직 끝나지 않은 경우에는
`judgementStatus=PROCESSING`, `result=null`로 처리하며 판정 이유 API를 호출하지 않습니다.

요청 예시:

```json
{
  "userId": "user-123",
  "goal": "여름 전까지 피부 컨디션 개선",
  "profile": {
    "skinType": "dry",
    "concerns": ["각질", "수분 부족"],
    "sleepHours": 6,
    "painAreas": []
  },
  "environment": {
    "weather": "sunny",
    "temperature": 29,
    "uvIndex": 8,
    "fineDust": "normal"
  },
  "excludedMissions": [],
  "maxMissions": 3
}
```

## 테스트

```bash
python -m pytest -q
```

자동 테스트에서는 실제 OpenAI API 키를 사용하지 않습니다. 실제 AI 응답은 서버 실행 후 Swagger에서 확인합니다.

## 다음 구현 순서

1. 주간 그룹 리포트 API
2. FFmpeg 기반 하이라이트 생성
