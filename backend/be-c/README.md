# Wedit BE C 서버

## 참조 문서

- `reference/기능 명세서 3abb3126338c80aa80d8e80bbddebbc6.pdf`

## 구현 범위

- Spring Boot 서버 기본 구조
- 공통 성공 응답
- 공통 예외 응답
- 입력값 검증 예외 처리
- CORS 기본 설정
- 헬스 체크 API
- 소셜 로그인 및 Wedit 토큰 발급
- 개인정보 처리 동의, 학습용 데이터 활용 동의
- 온보딩 정보 저장
- 그룹 생성, 목록 조회, 초대, 참여, 참여 확인
- 그룹 완료 현황 조회
- 오늘의 개인별 미션 조회
- 그룹 목표 진행률 조회
- 일일 개인/그룹 스탬프 지급
- 리워드 지급 조건 확인 및 지급
- W 정원 완성 판정 및 리워드 트리거
- 연속 기록, 지난 미션 달력, 포인트 조회/전환
- 하이라이트 모아보기, 푸시 토큰 등록, 알림 조회/읽음 처리
- BE A/BE B 내부 연동 포트 정렬 및 `X-Internal-Key` 검증
- 판정 결과 저장 시 미션 상태 갱신 및 포인트 중복 적립 방지

## 주요 API

### 인증/사용자

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | 소셜 로그인 토큰 검증 및 Wedit 토큰 발급 |
| POST | `/api/v1/users/{userId}/consent` | 개인정보 처리 동의 저장 |
| PATCH | `/api/v1/users/{userId}/consent/training-data` | 학습용 데이터 활용 동의 변경 |
| POST | `/api/v1/users/onboarding` | 온보딩 정보 저장 |

### 그룹

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/v1/groups` | 그룹 생성 |
| GET | `/api/v1/groups` | 내 그룹 목록 조회 |
| GET | `/api/v1/groups/{groupId}/invite` | 그룹 초대 코드/URL 조회 |
| GET | `/api/v1/groups/invite/preview` | 초대 코드로 참여할 그룹 미리보기 |
| POST | `/api/v1/groups/join` | 초대 코드로 그룹 참여 |
| GET | `/api/v1/groups/{groupId}/status` | 그룹원별 오늘 미션 완료 현황 조회 |
| GET | `/api/v1/groups/{groupId}/progress` | 그룹 목표 진행률 조회 |
| POST | `/api/v1/groups/{groupId}/stamps/daily` | 일일 개인/그룹 스탬프 지급 |
| POST | `/api/v1/groups/{groupId}/rewards/claim` | 리워드 지급 조건 확인 및 지급 |
| POST | `/api/v1/groups/{groupId}/garden/complete` | W 정원 완성 판정 |

### 미션

| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/api/v1/missions/today` | 저장된 오늘의 개인별 미션 조회 |
| POST | `/api/v1/missions/today/generate` | BE A 미션 생성 API 호출 후 오늘 미션 저장 |
| POST | `/api/v1/missions/results` | BE B 판정 결과를 BE C `mission_results`에 저장 |

`GET /api/v1/missions/today`는 조회 시점에 미션을 새로 생성하지 않는다. `missions` 테이블에 저장된 오늘 미션이 없으면 빈 목록을 반환한다. 저장된 미션의 AI 판정 기준은 `verificationCriteria`로 응답한다.

`POST /api/v1/missions/today/generate`는 BE A의 `{success, data, message}` 응답 중 `data.missions`를 오늘 날짜로 저장한다. `missionId`와 `date`는 BE C 저장 시점에 발급/관리한다.

`POST /api/v1/missions/results`는 BE B가 `X-Internal-Key`를 포함해 호출하는 내부 API이다. 판정 결과 저장 후 `missions.status`를 함께 갱신한다. `PASS`는 `PASSED`, `FAIL`은 `FAILED`, `HOLD`와 `ERROR`는 `SUBMITTED`로 반영한다. `PASS`인 경우 미션 1건당 1회만 포인트를 적립한다.

### 사용자

| Method | URL | 설명 |
| --- | --- | --- |
| DELETE | `/api/v1/users/{userId}` | 회원 탈퇴 및 BE B 클립 정리 요청 |
| GET | `/api/v1/users/{userId}/streak` | 미션 연속 완료 일수 조회 |
| GET | `/api/v1/users/{userId}/missions/history` | 월별 지난 미션 달력 조회 |
| GET | `/api/v1/users/{userId}/points` | 포인트 잔액과 최근 거래 내역 조회 |
| GET | `/api/v1/users/{userId}/highlights` | 과거 하이라이트 목록 조회 |
| POST | `/api/v1/users/{userId}/push-token` | 푸시 디바이스 토큰 등록/갱신 |
| GET | `/api/v1/users/{userId}/notifications` | 알림 목록 조회 |
| PATCH | `/api/v1/notifications/{notificationId}/read` | 알림 읽음 처리 |

사용자별 조회/등록 API는 `Authorization: Bearer temporary-token-{userId}` 기준으로 요청자와 URL의 `userId`가 같은지 검증한다. 다른 사용자의 스트릭, 지난 미션, 포인트, 하이라이트, 푸시 토큰, 알림 데이터에는 접근할 수 없다. 알림 읽음 처리도 해당 알림의 소유자만 수행할 수 있다.

### 포인트

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/v1/points/redeem` | 포인트 전환 신청 |

`GET /api/v1/users/{userId}/points`는 현재 잔액, 누적 적립/사용 포인트, 최근 포인트 거래 내역 10건을 반환한다. `POST /api/v1/points/redeem`은 포인트 잔액을 확인한 뒤 전환 신청 이력과 포인트 사용 거래를 저장한다. 실제 커머스/응모권 지급 연동은 MVP 범위에서 제외한다.

## 최근 추가 API 및 수정사항

### 추가된 API

| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/api/v1/users/{userId}/streak` | `mission_results.result = PASS` 기준으로 현재/최장 연속 완료 일수 조회 |
| GET | `/api/v1/users/{userId}/missions/history?year={year}&month={month}` | 월별 미션 수와 완료 수를 달력용 데이터로 조회 |
| GET | `/api/v1/users/{userId}/points` | 포인트 잔액, 누적 적립/사용, 최근 거래 내역 조회 |
| POST | `/api/v1/points/redeem` | 포인트 전환 신청 및 잔액 차감 |
| GET | `/api/v1/users/{userId}/highlights` | 사용자 하이라이트 목록 조회 |
| POST | `/api/v1/users/{userId}/push-token` | 푸시 알림용 디바이스 토큰 등록 또는 갱신 |
| GET | `/api/v1/users/{userId}/notifications` | 사용자 알림 목록 조회 |
| PATCH | `/api/v1/notifications/{notificationId}/read` | 알림 읽음 처리 |

### 연결 흐름 보완

- BE C에서 BE A 미션 생성 API 호출 후 응답의 `data.missions`를 오늘 날짜의 `missions`로 저장한다.
- BE B 판정 결과 수신 시 `mission_results`를 저장하고, `missions.status`를 판정 결과에 맞춰 갱신한다.
- 판정 결과가 `PASS`이면 포인트를 적립한다. 같은 사용자와 같은 미션에 대한 포인트 적립은 `point_transactions(user_id, reference_type, reference_id)` 유니크 제약으로 중복 저장을 방지한다.
- 스트릭, 지난 미션 달력, 그룹 완료 현황, 그룹 진행률, 스탬프, 리워드는 모두 `mission_results.result = PASS` 기준으로 집계한다.
- 사용자별 API와 알림 읽음 처리에는 요청자 소유권 검증을 추가했다.

### 내부 연동 설정

- BE C 기본 포트는 `8080`이다.
- BE C에서 호출하는 BE A 기본 주소는 `http://localhost:8001`이다.
- BE C에서 호출하는 BE B 기본 주소는 `http://localhost:8002`이다.
- BE A/BE B 내부 API에 `INTERNAL_API_KEY`가 설정된 환경에서는 BE C도 같은 값을 환경변수로 설정해야 한다.
- BE C는 내부 연동 호출 시 `X-Internal-Key` 헤더로 키를 전달하고, BE B가 호출하는 `POST /api/v1/missions/results`에서도 같은 헤더를 검증한다.
- 로컬에서 `INTERNAL_API_KEY`를 비워두면 내부키 헤더 전송과 검증을 생략한다. 내부키를 사용하는 통합 테스트나 배포 환경에서는 BE A, BE B, BE C의 `INTERNAL_API_KEY`를 동일하게 맞춰야 한다.

### 아직 남은 연결 지점

- 하이라이트 조회 API는 구현되어 있으나, 하이라이트 생성/저장 트리거는 BE A/BE B 연동 방식 확정 후 추가가 필요하다.
- 알림 목록/읽음 API와 푸시 토큰 저장은 구현되어 있으나, 실제 이벤트 발생 시 `notifications`를 생성하고 FCM 등으로 발송하는 모듈은 별도 구현이 필요하다.

## 실행

```bash
./gradlew bootRun
```

## 헬스 체크

```http
GET /api/health
```

## Swagger UI

서버 실행 후 브라우저에서 접속한다.

```text
http://localhost:8080/swagger-ui/index.html
```

## Swagger 테스트 순서 예시

1. `POST /api/v1/auth/login`으로 `accessToken`을 발급받는다.
2. Swagger 우측 상단 `Authorize`에 `Bearer {accessToken}` 형식으로 입력한다.
3. `POST /api/v1/groups`로 그룹을 생성한다.
4. `GET /api/v1/groups/{groupId}/status`로 완료 현황을 확인한다.
5. 미션 PASS 데이터가 저장된 뒤 `POST /api/v1/groups/{groupId}/stamps/daily`를 호출한다.
6. `GET /api/v1/groups/{groupId}/progress`로 그룹 목표 진행률을 확인한다.
7. 조건 충족 시 `POST /api/v1/groups/{groupId}/garden/complete`로 W 정원 완성을 판정한다.

## 테스트

```bash
./gradlew test
```
