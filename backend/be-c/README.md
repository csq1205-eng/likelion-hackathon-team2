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

### 포인트

| Method | URL | 설명 |
| --- | --- | --- |
| POST | `/api/v1/points/redeem` | 포인트 전환 신청 |

BE A/BE B 내부 API에 `INTERNAL_API_KEY`가 설정된 환경에서는 BE C도 같은 값을 환경변수로 설정해야 한다. BE C는 내부 연동 호출 시 `X-Internal-Key` 헤더로 전달한다.

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
