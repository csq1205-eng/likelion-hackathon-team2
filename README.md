# likelion-hackathon-team2

멋쟁이사자처럼 중앙해커톤 2팀 프로젝트

## 프로젝트 구조

| 경로 | 설명 |
| --- | --- |
| `backend/be-a` | AI 미션 생성, 판정 근거, 하이라이트/리포트 등 AI 처리 서버 |
| `backend/be-b` | 미션 클립 업로드, 프레임 추출, AI 판정 연동 서버 |
| `backend/be-c` | 사용자, 그룹, 미션 저장, 진행률, 스탬프, 리워드, 포인트, 알림 서버 |
| `frontend` | 프론트엔드 애플리케이션 |

## BE C 최근 반영사항

자세한 내용은 `backend/be-c/README.md`를 확인한다.

### 추가된 API

| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/api/v1/users/{userId}/streak` | 미션 연속 완료 일수 조회 |
| GET | `/api/v1/users/{userId}/missions/history?year={year}&month={month}` | 월별 지난 미션 달력 조회 |
| GET | `/api/v1/users/{userId}/points` | 포인트 잔액과 최근 거래 내역 조회 |
| POST | `/api/v1/points/redeem` | 포인트 전환 신청 |
| GET | `/api/v1/users/{userId}/highlights` | 사용자 하이라이트 목록 조회 |
| POST | `/api/v1/users/{userId}/push-token` | 푸시 디바이스 토큰 등록 또는 갱신 |
| GET | `/api/v1/users/{userId}/notifications` | 알림 목록 조회 |
| PATCH | `/api/v1/notifications/{notificationId}/read` | 알림 읽음 처리 |

### 연결 흐름 보완

- BE C에서 BE A 미션 생성 API를 호출하고, 응답의 `data.missions`를 오늘 날짜의 `missions`로 저장한다.
- BE B 판정 결과 수신 API인 `POST /api/v1/missions/results`는 `X-Internal-Key`를 검증한다.
- 판정 결과 저장 시 `missions.status`를 함께 갱신한다.
  - `PASS` -> `PASSED`
  - `FAIL` -> `FAILED`
  - `HOLD`, `ERROR` -> `SUBMITTED`
- `PASS` 판정이면 미션 1건당 1회만 포인트를 적립한다.
- 스트릭, 지난 미션 달력, 그룹 완료 현황, 그룹 진행률, 스탬프, 리워드는 `mission_results.result = PASS` 기준으로 집계한다.
- 사용자별 조회/등록 API와 알림 읽음 처리는 요청자 소유권을 검증한다.
- 포인트 중복 적립 방지를 위해 `point_transactions(user_id, reference_type, reference_id)` 유니크 제약을 추가했다.

### 내부 연동 포트

| 서버 | 기본 주소 |
| --- | --- |
| BE A | `http://localhost:8001` |
| BE B | `http://localhost:8002` |
| BE C | `http://localhost:8080` |

통합 테스트 시 BE A, BE B, BE C의 `INTERNAL_API_KEY` 값을 동일하게 맞춰야 한다. 로컬에서 `INTERNAL_API_KEY`를 비워두면 내부키 헤더 전송과 검증을 생략한다.
