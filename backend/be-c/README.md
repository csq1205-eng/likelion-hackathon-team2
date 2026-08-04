# WellLog 서버

## 참조 문서

- `reference/기능 명세서 3abb3126338c80aa80d8e80bbddebbc6.pdf`

## 생성 범위

- Spring Boot 서버 기본 구조
- 공통 성공 응답
- 공통 예외 응답
- 입력값 검증 예외 처리
- CORS 기본 설정
- 헬스 체크 API

## 실행

```bash
gradle bootRun
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
