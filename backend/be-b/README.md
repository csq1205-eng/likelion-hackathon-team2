# WEDIT BE B — 미션 클립 업로드 · AI 비전 판정 · 보관/파기

`백엔드 API 명세서 최종본`의 12장(미션/AI API 중 클립 업로드·판정·재촬영), 16장(클립 공유 API) 구현체입니다.
클립을 받아 ffmpeg로 프레임을 추출하고, OpenAI 비전 모델로 미션 수행 여부를 판정한 뒤,
BE A(`/api/ai/verdicts/reason`)를 호출해 사용자에게 보여줄 문장을 받아옵니다.


## 실행 방법

```bash
# 0. ffmpeg 설치 확인 (mac: brew install ffmpeg / ubuntu: apt install ffmpeg / win: choco install ffmpeg)
ffmpeg -version

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env에 OPENAI_API_KEY, BE_A_BASE_URL 등을 채운다.

uvicorn app.main:app --reload --port 8002
```

> **OneDrive 동기화 폴더에서 작업 중이라면** `.venv`를 프로젝트 폴더 밖(예: `C:\dev\wedit-venvs\be-b\.venv`)에
> 만드는 걸 권장합니다. OneDrive 실시간 동기화가 venv의 수천 개 파일과 충돌해 삭제/재생성 시 이전 패키지가
> 남아있는 것처럼 보이는 문제가 있었습니다. `pip install -r requirements.txt`와 `pytest`, `uvicorn` 모두
> 그 외부 `.venv`의 `python.exe`로 실행하면 됩니다 (예: `C:\dev\wedit-venvs\be-b\.venv\Scripts\python.exe -m pytest`).

- Swagger UI: http://127.0.0.1:8002/docs
- 상태 확인: http://127.0.0.1:8002/health
- 저장된 클립/프레임 파일: `GET /files/clips/{clipId}.mp4`, `GET /files/frames/{clipId}/{n}.jpg`
  (MVP에서는 로컬 디스크에 저장하고 그 경로를 정적 파일로 서빙합니다. 운영 전환 시 S3 등
  외부 스토리지로 교체하고 `to_public_url`만 바꾸면 됩니다.)

포트 구성: BE A `8001`, BE C `8080`, 기존 `ai-server` `8000`, 이 서비스는 기본 `8002`.

## 배포 (Render)

데모 시연을 위해 각 파트를 별도 임시 도메인으로 배포하는 방향으로 팀이 합의했습니다
(BE C는 이미 `https://wedit-be-c.onrender.com` 배포 완료). BE B도 같은 방식으로 배포합니다.

- 루트에 `Dockerfile`이 있습니다 (`python:3.12-slim` + ffmpeg 설치 + uvicorn을 `$PORT`로 바인딩).
  Render에서 이 리포의 `backend/be-b`를 루트 디렉터리로 지정한 Docker 서비스로 등록하면 됩니다.
- 필수 환경변수: `OPENAI_API_KEY`, `BE_A_BASE_URL`(BE A 배포 URL로 교체), `INTERNAL_API_KEY`
  (BE A/BE C와 값을 맞출 경우), 그리고 **`PUBLIC_BASE_URL`을 반드시 BE B의 실제 배포 도메인으로
  설정**해야 합니다 (`.env.example` 참고). 비워두면 응답의 `sourceClipUrl`/`frameUrl`이
  `localhost`로 나가 프론트/BE A에서 접근할 수 없습니다.
- **주의:** MVP 구현은 클립 파일과 SQLite DB를 로컬 디스크에 저장합니다(`app/storage.py`,
  `DATABASE_PATH`). Render 무료 티어처럼 디스크가 영속적이지 않은 환경에서는 재배포나 장시간
  유휴 후 재시작 시 업로드된 클립/판정 기록이 초기화됩니다. 데모 중에는 인스턴스가 계속 떠 있도록
  유지하고, 필요하면 Render의 영구 디스크(persistent disk) 옵션을 검토하세요.

## 테스트

```bash
python -m pytest -q
```

테스트는 실제 OpenAI/ffmpeg/BE A 호출 없이 동작합니다 (`tests/conftest.py`에서
`VisionService`/`ReasonClient`/프레임 추출기를 가짜 구현으로 주입).

## 인증

- 사용자 API(업로드/결과조회/공유/삭제): `Authorization: Bearer temporary-token-{userId}` 필요.
  BE C `AuthService`가 MVP 단계에서 실제 JWT 대신 발급하는 임시 토큰 형식을 그대로 신뢰합니다
  (`TemporaryAccessTokenResolver.java`와 동일 규칙). BE C가 실제 JWT로 전환하면 `app/auth.py`의
  `resolve_user_id`만 교체하면 됩니다.
- 내부 API(`highlight-complete`, `withdrawal-cleanup`): `X-Internal-Key` 헤더를 `INTERNAL_API_KEY`와
  비교합니다. BE A의 `callback_service.py`가 이미 이 헤더로 호출하도록 구현되어 있습니다.
  `INTERNAL_API_KEY`를 비워두면(로컬 개발) 검증을 생략합니다.

## 구현한 API

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/clips/upload` | 클립 업로드/재촬영(동일 API). 프레임 추출 → 비전 판정 → BE A 판정 이유 호출 |
| GET | `/api/clips/{clipId}/result` | 업로드가 202를 반환했을 때 폴링 조회 |
| PATCH | `/api/clips/{clipId}/share` | 공유 여부 변경 (`share_decided` 갱신, 보관 정책 재계산) |
| POST | `/api/clips/{clipId}/highlight-complete` | BE A 콜백. 비공유 클립은 즉시 파기 |
| DELETE | `/api/clips/{clipId}` | 사용자 직접 삭제 |
| POST | `/api/ai/clips/withdrawal-cleanup` | BE C가 탈퇴 처리 중 호출하는 내부 정리 API |

응답은 전부 명세서 4/5장의 `{success, data, message}` / 오류 봉투 형식을 따릅니다.

## 판정 흐름

```
업로드 → (재촬영 한도 확인 → 일일 판정 호출 한도 확인) → 파일 검증/저장
  → ffmpeg로 프레임 3~5장 추출 → OpenAI 비전 모델 판정(PASS/FAIL/HOLD)
  → BE A POST /api/ai/verdicts/reason 호출해 사용자용 문장 생성
  → ai_judgement_requests / mission_results 저장 → 보관 정책 계산
```

- 비전 판정 호출이 **설정 오류**(API 키 없음)면 즉시 `AI-001`(502)을 반환합니다.
- **네트워크/타임아웃** 오류면 `202 Accepted` + `judgementStatus=PROCESSING`을 반환하고,
  FastAPI `BackgroundTasks`로 한 번 더 재시도합니다. 재시도도 실패하면 `ERROR`로 종료 처리합니다
  (재촬영 큐/스케줄러 없이 단순화한 MVP 구현입니다).
- `retryCount`/`maxRetryCount`/`remainingRetryCount`는 **재촬영(2번째 이상 제출)일 때만** 응답에
  포함됩니다 (명세서 12.1/12.4 예시 응답 차이를 그대로 반영). `retryCount`는 이번 제출 이전까지
  누적된 FAIL 횟수이며 PASS 시 0으로 초기화되고, HOLD/ERROR는 이 카운트에 영향을 주지 않습니다.
  `총 제출 횟수(HOLD 포함) ≤ 6`은 별도 상한이며 마찬가지로 ERROR는 제외합니다.

## 보관/파기 정책

- 공유(`shared=true`) 클립: `retentionPolicy=KEEP_24_HOURS`, 판정 완료 시각 + `SHARED_CLIP_RETENTION_HOURS`
  (기본 24시간) 뒤 백그라운드 스윕(5분 주기)이 파기합니다.
- 비공유(`shared=false`) 클립: `retentionPolicy=KEEP_UNTIL_HIGHLIGHT_COMPLETE`, BE A의
  `highlight-complete` 콜백이 오면 그 자리에서 즉시 파기합니다.
- `PATCH /share`로 공유 여부가 바뀌면 보관 정책을 즉시 재계산합니다. 이미 `highlight-complete`가
  도착한 뒤 비공유로 확정되면 유예 없이 즉시 파기합니다.
- 탈퇴 시(`withdrawal-cleanup`)는 공유 여부와 무관하게 해당 사용자의 모든 클립을 즉시 파기합니다.

## 확인 필요 (팀 협의 대상)

명세서만으로 확정할 수 없어 MVP 기준으로 판단하고 구현한 부분입니다. 팀과 확인 후 필요하면 조정해 주세요.

1. **클립을 찾을 수 없을 때의 오류 코드**: ~~명세서 6장 공통 오류 코드에는 "클립 없음"에 대응하는
   코드가 없습니다.~~ → **확정됨.** `mission_clips`가 미션 하위 리소스인 점을 고려해 자체 추가했던
   `CLIP-001`(404)을 별도 공식 코드로 유지하기로 팀 협의로 확정되었습니다(효림, 2026-08-11).
   `MISSION-001`은 미션 자체를 찾지 못한 경우, `CLIP-001`은 클립 리소스 조회 실패로 의미를
   분리합니다.
2. **미션 유효 시간대 검증(MISSION-004, 18.3)**: ~~업로드 요청에 시간대 정보가 없고, BE B는
   `missions` 테이블에 접근하지 않습니다.~~ → **확정됨(생략).** 팀 협의 결과 데모 스코프에서는
   생략하기로 했습니다(효림, 2026-08-11) — 검증을 추가하면 오히려 복잡도만 늘어난다는 판단입니다.
   여전히 모든 시간대를 통과시키며, 별도 구현은 하지 않습니다.
3. **`mission_id`의 의미 범위**: ~~재촬영 한도(`retryCount` 등)를 "미션 인스턴스(사용자×날짜) 단위"로
   가정하고 구현했습니다~~ → **확정됨.** BE C(효림)가 BE A(최승환)의 미션 생성 결과를 저장할 때
   `missionId`를 발급하며, `missions` 테이블 저장 단위가 "사용자 + 날짜" 조합이라는 것이 팀 대화에서
   확정되었습니다. 즉 `mission_id`는 "미션 인스턴스(사용자×날짜)" 단위가 맞고, BE B의 기존 가정
   (명세서 12.4 "같은 미션 인스턴스" 문구 근거)과 일치하므로 `clip_service.py`의 재촬영 카운트 로직은
   변경할 필요가 없습니다.
4. **일일 AI 판정 호출 한도(MISSION-005)의 사용자 식별**: 업로드 요청에 `userId`가 없어
   `Authorization` 헤더(BE C 임시 토큰)로 식별합니다. 정식 인증 체계가 도입되면 이 부분을 맞춰야 합니다.
5. **`PATCH /share` 응답 형식**: 명세서에 Request 예시만 있고 Response 예시가 없습니다. 형제
   API들과 통일된 형태(`clipId`, `shared`, `shareDecided`, `retentionPolicy`, `retentionExpiresAt`)로
   자체 구성했습니다.
6. **판정 컨텍스트(mission_title, criteria)**: ~~업로드 요청에 미션 제목/판정 기준이 없어 BE B는
   미션 제목 없이 판정~~ → **구현됨(2026-08-11).** BE A(최승환)의 미션 생성 결과에 이미
   `title`/`verificationCriteria`가 포함되어 있어, 프론트가 업로드 시 함께 실어 보낼 수 있도록
   `POST /api/clips/upload`에 선택 필드 `missionTitle`(문자열), `criteria`(JSON 배열 문자열, BE A
   `verificationCriteria`와 동일하게 `[{"id":..., "description":...}, ...]` 형태)를 추가했습니다.
   값이 오면 AI 비전 판정과 BE A `verdicts/reason` 호출 모두에 그대로 전달되어, AI가 매번 스스로
   기준 id를 새로 만드는 대신 고정된 기준으로 판정합니다. 값이 없으면 기존과 동일하게 동작합니다
   (하위 호환). 단, `retry_processing_judgement`(202 이후 백그라운드 재시도)는 이 값을 DB에
   저장해두지 않아 재시도 시에는 여전히 컨텍스트 없이 판정합니다 — 필요하면 추후 저장 컬럼을
   추가해야 합니다.
7. **외부 스토리지 미적용**: 명세서는 "외부 스토리지에 저장하고 DB에는 URL만 저장"을 요구하지만,
   MVP에서는 로컬 디스크 + `/files` 정적 서빙으로 대체했습니다. 배포 환경에서는 `app/storage.py`를
   S3 등으로 교체해야 합니다.
8. **비공유 클립이 `highlight-complete`를 영영 못 받는 경우**: 명세서에는 시간 기반 안전장치가
   명시돼 있지 않아 구현하지 않았습니다. BE A가 그날 하이라이트를 생성하지 않으면 해당 클립은
   파기되지 않고 남습니다. 필요하면 안전망(예: N일 후 강제 파기)을 추가해야 합니다.
9. **`withdrawal-cleanup`의 202 Accepted 분기 미구현**: 명세서 16.4는 스토리지 삭제가 지연되면
   `202 Accepted` + `cleanupStatus=PROCESSING`을 반환하고 BE B가 비동기로 후처리하는 흐름을
   정의합니다. 현재 구현은 로컬 디스크 삭제라 항상 동기로 끝나 `COMPLETED`/`NO_CLIPS`/`FAILED`만
   반환하며 `PROCESSING` 분기가 없습니다. 외부 스토리지(S3 등)로 전환 시 삭제 지연이 생길 수 있으므로
   그때 이 분기를 추가할지, 아니면 지금처럼 동기 처리로 유지할지 협의가 필요합니다.
