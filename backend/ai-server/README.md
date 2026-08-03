# Welllog BE B — 미디어 파이프라인 & 비전 판정

담당: 강원모

## 실행 방법

```bash
# 1. ffmpeg 설치 확인 (mac: brew install ffmpeg / ubuntu: apt install ffmpeg)
ffmpeg -version

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 실제 OPENAI_API_KEY 입력 후:
export $(cat .env | xargs)

# 4. 서버 실행
uvicorn main:app --reload
```

실행 후 http://localhost:8000/docs 에서 Swagger 문서로 바로 테스트 가능 (FE D/E, BE A, BE C와 API 스펙 공유용으로도 활용).

`.env`의 값은 전부 선택이고 `OPENAI_API_KEY`만 필수다. 배포 시 최소한 `ALLOWED_ORIGINS`와 `INTERNAL_API_KEY`는 채울 것.

## 테스트 예시

```bash
# 1. 클립 업로드 -> 판정 (이 시점부터 24시간 파기 카운트 시작)
#    네트워크 오류가 나면 200 대신 202(큐잉)가 올 수 있음
curl -X POST http://localhost:8000/api/clips/upload \
  -F "mission_id=test-001" \
  -F "mission_label=물 한 잔 마시기" \
  -F 'criteria=[{"id":"cup_visible","description":"컵이 화면에 보인다"},{"id":"drinking_motion","description":"마시는 동작이 확인된다"}]' \
  -F "clip=@sample_clip.mp4"

# 2. (202가 왔다면) 재처리 상태 조회
curl http://localhost:8000/api/clips/{clip_id}/status

# 3. 사용자가 클립 공유 여부를 선택 (공유 안 함도 반드시 호출할 것 — 아래 '공유 결정' 참고)
curl -X PATCH http://localhost:8000/api/clips/{clip_id}/share \
  -H "Content-Type: application/json" -d '{"shared": true}'

# 4. BE A가 하이라이트 생성을 마치면 호출 (비공유 + 공유결정 완료 클립은 이 시점 즉시 파기)
curl -X POST http://localhost:8000/api/clips/{clip_id}/highlight-complete

# 5. 사용자가 공유 클립을 직접 삭제
curl -X DELETE http://localhost:8000/api/clips/{clip_id}
```

`INTERNAL_API_KEY`를 설정했다면 모든 `/api/*` 호출에 `-H "X-Internal-Key: <키>"`를 붙여야 한다. `/health`는 인증 없이 열려 있다.

## 판정 흐름과 임계값 정책

```
클립 업로드 → 프레임 4장 추출(가로 최대 768px) → gpt-4o-mini 판정
  → judgment_policy 임계값 적용 → 최종 verdict → 프레임 즉시 삭제
```

- `vision_judge.py`는 **모델이 뭐라고 했는지**만 책임진다 (`raw_verdict`).
- `judgment_policy.py`가 **최종 판정**을 결정한다. 평가셋(~65개 클립) 튜닝 노브는 전부 이 파일에 모여 있다.
  - `PASS_CONFIDENCE_THRESHOLD` 미만의 pass → `hold`로 내림 (근거 없는 통과 방지)
  - `FAIL_CONFIDENCE_THRESHOLD` 미만의 fail → `hold`로 내림 (애매한 실패로 재촬영 횟수를 깎지 않음)
  - 미션 정의에서 `criteria`를 내려준 경우, 전부 충족해야 pass (`REQUIRE_ALL_CRITERIA`)
  - 정책을 바꿀 때마다 `POLICY_VERSION`을 올린다 → 응답의 `policy_version`으로 어떤 버전의 판정인지 추적 가능
- 응답에는 `raw_verdict` / `policy_version` / `policy_note`가 함께 들어간다(선택 필드). BE A는 무시해도 되고, 벤치마크 때 "정책 적용 전후 오탐율" 비교에 쓴다.

### criteria 주입 (권장)

`criteria`를 안 넘기면 모델이 매번 다른 id를 지어내서 집계가 불가능하다.
미션 정의에 고정 id로 판정 기준을 넣고 업로드 시 함께 넘기면, 모델은 그 id의 충족 여부만 채운다.
→ "어떤 기준에서 자주 걸리는지"를 평가셋에서 집계할 수 있게 된다.

## 개인정보 / 클립 처리 정책

**파기 대상은 원본 클립 + 추출된 프레임 이미지 둘 다다.** (프레임은 별개의 개인정보 파일)

- 추출 프레임: 판정 직후 `pipeline.py`의 `finally`에서 **무조건** 삭제 (성공/실패/예외 무관)
- 판정 완료 시점부터 `clips.db`에 기록되고 24시간 카운트 시작
- 비공유 클립: `highlight-complete` 콜백이 오면 그 자리에서 즉시 파기
- 공유 클립: 사용자가 직접 삭제(`DELETE`)할 때까지 보관
- **fail/hold 클립**: 하이라이트 대상이 아니므로 24시간을 기다리지 않고 조기 파기
- **판정 실패 클립**: 422/큐 최종 실패 시 `clips` 테이블에 기록되지 않으므로 그 경로에서 직접 파기 (고아 파일 방지)
- 안전망: 5분마다 도는 백그라운드 스케줄러가 24시간 하드 캡을 넘긴 클립을 전부 파기
- 파일 삭제에 실패하면 `deleted`로 기록하지 않는다 → 다음 틱에 다시 시도

### 공유 결정(share_decided)과 콜백 경합

사용자가 "공유" 버튼을 누르기 **전에** BE A의 `highlight-complete` 콜백이 먼저 도착하면
클립이 즉시 사라져 공유가 영영 불가능해진다. 이걸 막기 위해:

- `PATCH /share`는 공유 여부와 함께 "사용자가 결정했음"(`share_decided`)을 기록한다.
- 콜백 시점에 `share_decided=0`이면 즉시 파기하지 않고 `SHARE_DECISION_GRACE_MINUTES`(기본 10분) 뒤 스케줄러가 파기한다.
- **FE 요청사항**: 사용자가 "공유 안 함"을 선택한 경우에도 `PATCH /share {"shared": false}`를 호출해야 한다. 그래야 유예 없이 즉시 파기된다.

## 재촬영 횟수 제한 (DB 기반)

- `retry_counts` 테이블에 미션별 카운트 저장 (서버 재시작해도 유지)
- `count` (기본 상한 3): 실제 판정이 `fail`인 경우 / 재시도해도 의미 없는 오류(손상 파일 등)
  - **판정을 통과하면 0으로 리셋된다** (과거 실패가 다음 인증을 막지 않도록)
- `total_attempts` (기본 상한 6): verdict 무관 총 판정 호출 수.
  `hold`가 계속 나오는 입력으로 OpenAI 호출을 무한히 태우는 걸 막는 비용 방어선
- 카운트가 **안** 올라가는 경우: 네트워크 오류/모델 스키마 위반으로 재처리 큐에 들어간 경우 (사용자 잘못이 아니므로)

> ⚠️ **BE A/C와 확인 필요**: `mission_id`의 스코프가 "미션 정의 ID"인지 "사용자 × 날짜 인스턴스 ID"인지에 따라
> 이 카운터의 의미가 완전히 달라진다. 미션 정의 ID가 들어오면 **한 사람의 실패가 전체 사용자를 막는다.**

## 네트워크 오류 대응 (재처리 큐)

- `errors.py`가 재시도 가능한 오류를 분류
  - 네트워크성(연결 끊김/타임아웃/레이트리밋/5xx) → 재시도 5회
  - **모델 스키마 위반(`VerdictParseError`) → 재시도 2회** (사용자 잘못이 아니라 큐로 보내되, 같은 입력이면 또 실패할 수 있어 예산을 낮게)
  - 그 외(파일 손상 `FrameExtractionError` 등) → 즉시 422 + 재촬영 횟수 차감 + 클립 파일 파기
- 재시도 가능: `upload_jobs` 테이블에 큐잉 → 클라이언트에 202 → 2분마다 도는 스케줄러가 재처리
- 최종 실패 시: 재촬영 횟수 차감 + 클립 파일 파기
- `main.py`와 `scheduler.py`가 `pipeline.py`의 `process_clip()`을 공유 → 판정 로직은 한 곳만 고치면 됨

## 안정성 관련 구현 메모

- **엔드포인트는 전부 `async def`가 아니라 `def`다.** 내부에서 ffmpeg/OpenAI/SQLite 동기 호출을 하므로,
  `async def`로 두면 업로드 한 건이 도는 10~15초 동안 `/health`를 포함한 서버 전체가 멈춘다.
  그룹 챌린지 특성상 동시 업로드가 몰리므로 데모에서 바로 드러나는 문제다.
- **타임아웃**: ffmpeg/ffprobe 30초, OpenAI 30초(`VISION_TIMEOUT_SEC`), OpenAI SDK 자체 재시도는 0회(중복 과금 방지)
- **SQLite**: WAL 모드 + `busy_timeout` 10초 → 요청 스레드/스케줄러 스레드 동시 접근 시 `database is locked` 방지
- **스케줄러**: `max_instances=1`, `coalesce=True` → 한 틱이 길어져도 같은 잡이 겹쳐 돌며 중복 판정하지 않음
- **업로드 용량 상한**: 기본 50MB (`MAX_UPLOAD_MB`), 스트리밍 저장 중 초과 시 413
- **CORS**: `ALLOWED_ORIGINS`로 설정. PWA가 다른 오리진에서 붙으므로 필수
- **내부 인증**: `INTERNAL_API_KEY` 설정 시 `X-Internal-Key` 헤더 검증. BE B는 사용자 인증을 하지 않으므로, 이게 없으면 누구나 임의 clip_id를 DELETE하거나 OpenAI 크레딧을 태울 수 있다

## DB 마이그레이션

`init_db()`가 기존 `clips.db`에 없는 컬럼을 자동으로 `ALTER TABLE` 한다.
기존 DB 파일을 지울 필요는 없지만, 개발 중이라면 `rm -rf storage/`로 깨끗하게 시작하는 쪽이 편하다.

추가된 컬럼: `clips.verdict`, `clips.share_decided`, `clips.highlight_generated_at`,
`retry_counts.total_attempts`, `upload_jobs.criteria_json`

## 실제 OpenAI API 연동 확인

이 리포의 개발 환경(샌드박스)은 `api.openai.com`에 네트워크 접근이 막혀 있어서, 실제 API 호출 테스트는 **로컬에서 직접** 실행해야 한다.

```bash
export OPENAI_API_KEY=sk-...
python3 scripts/live_smoke_test.py
```

합성 영상으로 실제 gpt-4o-mini 호출까지 도는지만 확인하는 스모크 테스트. verdict 값 자체는 의미 없고, 정상 응답 + 스키마 일치만 본다.

**참고**: `openai==1.51.0`이 최신 `httpx`(0.28+)와 호환되지 않아 클라이언트 생성이 실패하는 버그가 있어 `openai==1.109.1`로 올렸음. 로컬에 이미 설치돼 있다면 `pip install -r requirements.txt --upgrade`.

## 테스트 현황

```bash
python3 tests/test_retention_policy.py    # 24시간 파기 정책 로직
python3 tests/test_retry_queue.py         # 네트워크 오류 재처리 큐 로직
python3 tests/test_frame_extraction.py    # 실제 ffmpeg로 합성 영상 프레임 추출 (E2E)
python3 tests/test_api.py                 # FastAPI TestClient로 실제 HTTP 흐름 전체
```

> ⚠️ **이번 수정으로 기존 테스트 중 아래는 기대값을 갱신해야 한다.**
> - `test_retention_policy.py`: "비공유 + 하이라이트 완료 → 즉시 파기" 케이스는 이제 `share_decided=1`이 있어야 True다.
>   (`share_decided=0`이면 유예 시간 전까지 False) fail/hold 조기 파기 케이스도 새로 추가할 것.
> - `test_api.py`: `highlight-complete` 응답이 `{"purged": true}`가 되려면 그 전에 `PATCH /share`를 호출해야 한다.
>   업로드 응답에 `raw_verdict`/`policy_version`/`policy_note` 필드가 추가되었다.
> - `pipeline.process_clip()` / `vision_judge.judge_mission()` 시그니처에 `criteria` 인자가 추가되었다(기본값 None이라 기존 호출은 그대로 동작).
> - mock 대상은 그대로 `pipeline.judge_mission` 또는 `vision_judge.judge_mission`을 쓰면 된다.

## 다음에 할 일

- [x] `scripts/live_smoke_test.py` 로컬 실행 → 8/2 밤 실제 OpenAI 연동 확인 완료 (스키마 검증 통과)
- [ ] 기존 테스트 3건 기대값 갱신 (위 ⚠️ 참고)
- [ ] 실제 휴대폰 촬영본으로 전체 파이프라인 1회 검증
- [x] clips.db를 BE C의 메인 DB로 이관할지 결정 → 8/3: 서버 분리 구조상 이관 안 함
- [ ] **BE A/C와 `mission_id` 스코프 확정** (재촬영 카운터가 사용자별인지 미션 정의별인지)
- [ ] **BE A와 `highlight-complete` 호출 시점 합의** (공유 결정 이후 호출 vs 유예 의존)
- [ ] 미션 정의에 고정 `criteria` 추가 (기획/BE A와 협의)
- [ ] gpt-4o-mini vs gpt-4o, `VISION_IMAGE_DETAIL` low vs auto 정확도/비용 비교용 평가셋(~65개 클립) 벤치마크 스크립트 작성
- [ ] `judgment_policy.py` 임계값 튜닝 → "오탐율 X% → Y%" 수치 확보 (발표 자료용)
- [ ] 코드 팀 레포에 푸시
