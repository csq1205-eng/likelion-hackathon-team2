# WEDIT BE A

WEDIT의 **AI 개인별 미션 생성 + 추천 이유 + 안전/제외 필터**를 구현한 FastAPI MVP입니다.
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
- 주간 그룹 통계를 AI 리포트로 변환하고 실패 시 규칙 문장으로 자동 대체
- 개인별 주간 미션 통계를 AI 리포트로 변환하고 실패 시 규칙 문장으로 자동 대체
- FFmpeg로 세로형 하이라이트 영상 생성 및 자막·완료 카드 합성
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

모든 `/api/ai/*` 성공 응답은 최종 명세서의 공통 형식을 사용합니다.

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

입력 검증 및 인증 오류도 `timestamp`, `status`, `code`, `message`, `errors`, `path`를
포함하는 공통 오류 형식으로 반환합니다. 입력 검증 실패는 `COMMON-001`, 내부 키 누락은
`AUTH-001`, 유효하지 않은 내부 키는 `AUTH-002`를 사용합니다.

## Docker 배포

```bash
docker build -t wedit-be-a .
docker run --rm -p 10000:10000 --env-file .env wedit-be-a
```

루트 `Dockerfile`은 Linux 이미지에 FFmpeg/FFprobe와 Noto CJK 한글 폰트를 설치하고,
UID 10001의 비루트 사용자로 서비스를 실행합니다. 배포 플랫폼이 주입하는 `PORT`가 없으면
10000번 포트를 사용합니다.

## 미션 정책

안전 규칙은 Python 필터 코드와 분리된 `config/mission_policy_rules.json`에서 로드합니다.
`MISSION_POLICY_RULES_PATH`로 배포 환경별 정책 파일을 주입할 수 있습니다. BE B의
`mission_policy_rules` API 계약이 확정되면 `FileMissionPolicyRepository`를 BE B 어댑터로
교체하도록 저장소 경계를 분리했습니다.

## API

`POST /api/ai/missions/generate`

BE C와 연동하는 내부 AI API:

- `POST /api/ai/verdicts/reason`: 내부 판정 결과를 사용자용 문장으로 변환
- `POST /api/ai/highlights/generate`: 클립을 조합해 FFmpeg 하이라이트 영상을 생성
- `POST /api/ai/highlights/complete`: 저장이 끝난 하이라이트의 각 클립에 대해 BE B 콜백 호출
- `POST /api/ai/reports/weekly`: BE C가 계산한 주간 그룹 통계를 자연어 리포트로 변환
- `POST /api/ai/reports/weekly/personal`: BE C가 계산한 개인 주간 미션 통계를 자연어 리포트로 변환

위 내부 API들은 최종 외부 조회 API가 아닙니다. BE C가 생성 결과를 저장한 뒤
`GET /api/v1/missions/today`, `GET /api/v1/groups/{groupId}/highlight`,
`GET /api/v1/groups/{groupId}/report`에서 조회 응답으로 변환합니다.

## 서버 간 인증

`INTERNAL_API_KEY`가 설정되어 있으면 모든 `/api/ai/*` 요청에 같은 값을 담은
`X-Internal-Key` 헤더가 필요합니다. 키가 비어 있는 로컬 환경에서는 인증을 강제하지 않으며,
`/health`는 배포 헬스체크를 위해 항상 인증 없이 접근할 수 있습니다.

```http
X-Internal-Key: change-me
```

## 주간 그룹 리포트

BE C가 미리 계산한 집계값을 전달하면 BE A는 통계를 다시 계산하지 않고 사용자용 문장만 생성합니다.
AI를 사용할 수 없거나 호출이 실패하면 규칙 기반 문장을 반환합니다.

```http
POST /api/ai/reports/weekly
```

```json
{
  "groupId": 10,
  "weekStartDate": "2026-08-03",
  "memberCount": 4,
  "assignedMissionCount": 20,
  "completedMissionCount": 15,
  "completionRate": 75.0,
  "previousWeekCompletionRate": 60.0,
  "currentStreakDays": 5,
  "dailyStats": [
    {
      "date": "2026-08-03",
      "assignedMissionCount": 3,
      "completedMissionCount": 2
    }
  ],
  "topMissionTypes": ["HYDRATION", "SUN_CARE"]
}
```

응답의 `reportSource`는 `AI` 또는 `FALLBACK`입니다.

## 개인 주간 리포트

BE C의 `GET /api/v1/users/me/weekly-report-data` 응답 `data`를 전달하면 BE A가 개인의
완료율, 달성 일수, 연속 달성 기록, 미션 유형 및 시간대별 통계를 바탕으로 리포트 문장을 생성합니다.
AI를 사용할 수 없거나 호출이 실패하면 같은 집계값을 이용한 규칙 기반 문장을 반환합니다.

```http
POST /api/ai/reports/weekly/personal
X-Internal-Key: change-me
Content-Type: application/json
```

```json
{
  "userId": 123,
  "weekStartDate": "2026-08-03",
  "weekEndDate": "2026-08-09",
  "totalMissionCount": 6,
  "completedMissionCount": 4,
  "failedMissionCount": 1,
  "notSubmittedMissionCount": 1,
  "completionRate": 66.66666666666667,
  "achievedDayCount": 0,
  "currentStreakDays": 0,
  "longestStreakDays": 0,
  "dailyStats": [
    {
      "date": "2026-08-03",
      "totalMissionCount": 6,
      "completedMissionCount": 4,
      "failedMissionCount": 1,
      "notSubmittedMissionCount": 1,
      "completionRate": 66.66666666666667,
      "achieved": false
    },
    {
      "date": "2026-08-04",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    },
    {
      "date": "2026-08-05",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    },
    {
      "date": "2026-08-06",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    },
    {
      "date": "2026-08-07",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    },
    {
      "date": "2026-08-08",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    },
    {
      "date": "2026-08-09",
      "totalMissionCount": 0,
      "completedMissionCount": 0,
      "failedMissionCount": 0,
      "notSubmittedMissionCount": 0,
      "completionRate": 0.0,
      "achieved": false
    }
  ],
  "missionTypeStats": [
    {
      "missionType": "HYDRATION",
      "totalMissionCount": 6,
      "completedMissionCount": 4,
      "failedMissionCount": 1,
      "notSubmittedMissionCount": 1,
      "completionRate": 66.66666666666667
    }
  ],
  "slotStats": [
    {
      "slot": "MORNING",
      "totalMissionCount": 6,
      "completedMissionCount": 4,
      "failedMissionCount": 1,
      "notSubmittedMissionCount": 1,
      "completionRate": 66.66666666666667
    }
  ]
}
```

`dailyStats`에는 요청 주간의 7개 날짜가 하루씩 모두 포함되어야 합니다. 각 통계의 전체
미션 수는 완료·실패·미제출 수의 합과 같아야 하고, `completionRate`도 해당
집계와 일치해야 합니다. `dailyStats`, `missionTypeStats`, `slotStats` 각각의 합계 역시 주간
전체 집계와 일치해야 합니다.

성공 응답 예시:

```json
{
  "success": true,
  "data": {
    "userId": 123,
    "weekStartDate": "2026-08-03",
    "weekEndDate": "2026-08-09",
    "summaryText": "이번 주에는 총 6개의 미션 중 4개를 완료해 완료율 66.6667%를 기록했어요.",
    "encouragementText": "완료하지 못한 미션도 괜찮아요. 다음 주에는 한 가지 미션부터 시작해 봐요.",
    "reportSource": "FALLBACK"
  },
  "message": null
}
```

응답의 `reportSource`는 OpenAI가 생성한 경우 `AI`, 규칙 기반 문장을 사용한 경우
`FALLBACK`입니다.

## 하이라이트 완료 콜백 안정성

하이라이트 영상 저장이 성공한 뒤 BE B의 다음 API를 클립별로 호출합니다.

```http
POST /api/clips/{clipId}/highlight-complete
```

- `408`, `425`, `429`, `5xx` 및 네트워크 오류는 기본 3회까지 재시도합니다.
- 재시도 간격은 기본 `0.25초 → 0.5초`의 지수 백오프를 사용합니다.
- `4xx` 비재시도 오류는 즉시 해당 클립의 실패로 기록합니다.
- 모든 재시도는 동일한 `Idempotency-Key`를 사용합니다.
- 여러 클립 중 일부가 실패해도 나머지 콜백을 계속 처리합니다.
- 중복 `clipId` 요청은 422로 거부합니다.

응답의 `callbackStatus` 또는 완료 API의 `status` 값은 다음과 같습니다.

- `COMPLETED`: 모든 클립 콜백 성공
- `PARTIAL`: 일부 성공, 일부 실패
- `FAILED`: 모든 클립 콜백 실패
- `SKIPPED`: 로컬 설정 등으로 콜백 비활성화

성공한 ID는 `notifiedClipIds`, 실패한 ID는 `failedClipIds`에서 확인할 수 있습니다.
콜백 실패가 발생해도 이미 저장된 하이라이트 영상의 `status`는 `COMPLETED`로 유지됩니다.

```dotenv
HIGHLIGHT_CALLBACK_RETRY_ATTEMPTS=3
HIGHLIGHT_CALLBACK_BACKOFF_SECONDS=0.25
```

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

BE B의 현재 `VerdictResponse`도 같은 엔드포인트에 그대로 전달할 수 있습니다. BE A가
snake_case 필드, UUID 문자열 ID, 소문자 판정값과 `0~1` 신뢰도를 기존 계약으로 정규화합니다.

```json
{
  "mission_id": "mission-2026-08-10-001",
  "clip_id": "83fe9cc1-08f8-4192-9510-ff7866836286",
  "verdict": "hold",
  "confidence": 0.72,
  "criteria": [{"id": "application_action", "met": false}],
  "model_notes": "internal only",
  "processed_at": "2026-08-10T12:30:00Z"
}
```

응답에는 사용자용 `reason`과 `reasonSource`만 포함되며 `model_notes`는 포함되지 않습니다.

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
