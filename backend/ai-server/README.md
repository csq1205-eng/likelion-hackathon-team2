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

## 테스트 예시

```bash
# 1. 클립 업로드 -> 판정 (이 시점부터 24시간 파기 카운트 시작)
#    네트워크 오류가 나면 200 대신 202(큐잉)가 올 수 있음
curl -X POST http://localhost:8000/api/clips/upload \
  -F "mission_id=test-001" \
  -F "mission_label=물 한 잔 마시기" \
  -F "clip=@sample_clip.mp4"

# 2. (202가 왔다면) 재처리 상태 조회
curl http://localhost:8000/api/clips/{clip_id}/status

# 3. 사용자가 클립 공유를 선택 (안 하면 기본 비공유)
curl -X PATCH http://localhost:8000/api/clips/{clip_id}/share \
  -H "Content-Type: application/json" -d '{"shared": true}'

# 4. BE A가 하이라이트 생성을 마치면 호출 (비공유 클립은 이 시점 즉시 파기)
curl -X POST http://localhost:8000/api/clips/{clip_id}/highlight-complete

# 5. 사용자가 공유 클립을 직접 삭제
curl -X DELETE http://localhost:8000/api/clips/{clip_id}
```

## 재촬영 횟수 제한 (DB 기반)

- `retry_counts` 테이블에 미션별 카운트를 저장 (서버 재시작해도 유지됨)
- 카운트가 올라가는 경우만: 실제 판정 결과가 `fail`인 경우 / 재시도해도 의미 없는 오류(예: 손상된 파일)
- 카운트가 **안** 올라가는 경우: 네트워크 오류로 재처리 큐에 들어간 경우 (사용자 잘못이 아니므로)
- 로직 검증: `python3 tests/test_retry_queue.py`

## 네트워크 오류 대응 (재처리 큐)

- `errors.py`가 OpenAI 쪽 네트워크성 오류(연결 끊김/타임아웃/레이트리밋/서버 5xx)만 "재시도 가능"으로 분류
- 재시도 가능한 오류: `upload_jobs` 테이블에 큐잉 -> 클라이언트에는 202 응답 -> 2분마다 도는 스케줄러가 재처리
- 재시도 불가능한 오류(예: 파일 손상): 큐에 넣지 않고 즉시 실패 응답(422), 사용자 재촬영 횟수 차감
- 재시도가 `max_attempts`(기본 5회)를 넘기면 최종 실패 처리, 그때서야 사용자 재촬영 횟수 차감
- `main.py`의 업로드 로직과 `scheduler.py`의 재처리 로직이 `pipeline.py`의 `process_clip()`을 공유해서, 판정 로직이 바뀌어도 한 곳만 고치면 됨

## 클립 처리 정책 (파기 스케줄러)

- 판정 완료 시점부터 `clips.db`에 기록되고 24시간 카운트 시작
- 비공유 클립: `highlight-complete` 콜백이 오면 그 자리에서 즉시 파기
- 공유 클립: 사용자가 직접 삭제(`DELETE`)할 때까지 보관
- 안전망: 5분마다 도는 백그라운드 스케줄러가 24시간 하드 캡을 넘긴 클립을 전부 파기 (콜백을 놓친 경우 대비)
- 로직 검증: `python3 tests/test_retention_policy.py`

## 실제 OpenAI API 연동 확인 (API 키 발급 후)

이 리포의 개발 환경(샌드박스)은 `api.openai.com`에 네트워크 접근이 막혀 있어서, 실제 API 호출 테스트는 **로컬에서 직접** 실행해야 합니다.

```bash
export OPENAI_API_KEY=sk-...
python3 scripts/live_smoke_test.py
```

합성 영상으로 실제 gpt-4o-mini 호출까지 도는지(연동 자체가 살아있는지)만 확인하는 스모크 테스트예요. verdict 값 자체(pass/fail)는 의미 없고, 정상적으로 응답이 오고 스키마가 맞는지만 봅니다. 정확도 검증은 나중에 실제 클립으로 모을 평가셋(~65개)으로 진행하세요.

**참고**: 이 과정에서 `requirements.txt`의 `openai==1.51.0`이 최신 `httpx`(0.28+)와 호환되지 않아 클라이언트 생성 자체가 실패하는 버그를 발견해서 `openai==1.109.1`로 올렸습니다. 혹시 로컬에 이미 설치된 게 있다면 `pip install -r requirements.txt --upgrade`로 갱신하세요.

## 테스트 현황 (20개 전부 통과, 전부 오프라인/mock)

```bash
python3 tests/test_retention_policy.py    # 5개 - 24시간 파기 정책 로직
python3 tests/test_retry_queue.py         # 5개 - 네트워크 오류 재처리 큐 로직
python3 tests/test_frame_extraction.py    # 3개 - 실제 ffmpeg로 합성 영상 프레임 추출 (E2E)
python3 tests/test_api.py                 # 7개 - FastAPI TestClient로 실제 HTTP 흐름 전체
```

`test_frame_extraction.py`와 `test_api.py`는 OpenAI 판정 부분만 목(mock)으로 대체하고 나머지는 전부 실제 코드(ffmpeg, DB, FastAPI 라우팅)로 돈다. 실제 OpenAI 키/휴대폰 촬영본 없이도 여기까지는 검증 완료.

**이 과정에서 발견한 버그**: `frame_extraction.py`의 ffprobe 옵션에 오타(`noprint_wrapper` → `noprint_wrappers`)가 있었음. 수정 완료.

## 다음에 할 일

- [x] `scripts/live_smoke_test.py` 로컬 실행 → 8/2 밤 실제 OpenAI 연동 확인 완료 (스키마 검증 통과)
- [ ] 실제 휴대폰 촬영본으로 전체 파이프라인 1회 검증
- [x] clips.db를 BE C의 메인 DB로 이관할지 결정 → 8/3: 서버 분리(Python AI 서버 / Java 도메인 서버) 구조상 이관 안 함. BE B가 자체 SQLite로 관리하고 최종 판정 결과만 API로 전달하는 것으로 확정
- [ ] gpt-4o-mini vs gpt-4o 정확도 비교용 평가셋(~65개 클립) 벤치마크 스크립트 작성
- [x] BE A(최승환)와 판정 스키마(models.py), highlight-complete 콜백 계약 최종 확정 — 8/2 확정: 스키마 그대로 사용, hold는 이미 지원됨, 콜백은 클립별 즉시 호출
- [ ] 코드 팀 레포에 푸시
