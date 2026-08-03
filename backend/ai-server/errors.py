"""
어떤 예외가 '재처리 큐'에 들어갈 수 있는지 판단한다.

- 네트워크/일시적 오류 (연결 끊김, 타임아웃, 레이트리밋, OpenAI 서버 5xx)
  -> 재시도 가능. 사용자의 재촬영 횟수를 차감하지 않고 큐에 저장한다.
- 모델 응답 스키마 위반 (VerdictParseError)
  -> 사용자 잘못이 아니므로 재시도 가능. 단, 같은 입력이면 또 실패할 가능성이 있어
     max_attempts를 낮게 잡아 비용이 새는 걸 막는다(main.py의 retry_budget_for 참고).
- 그 외 (손상된 파일로 ffmpeg가 실패하는 등)
  -> 재시도해도 똑같이 실패하므로 즉시 실패 처리하고, 사용자 재촬영 횟수를 차감한다.
"""
import openai


class FrameExtractionError(Exception):
    """ffmpeg/ffprobe가 클립을 읽지 못함. 재시도해도 동일하게 실패하므로 재시도 불가."""


class VerdictParseError(Exception):
    """비전 모델이 약속된 JSON 스키마를 지키지 않음. 사용자 잘못이 아니므로 재시도 가능."""


RETRYABLE_EXCEPTIONS = (
    openai.APIConnectionError,
    openai.APITimeoutError,
    openai.RateLimitError,
    openai.InternalServerError,
    VerdictParseError,
)

# 재시도 가능하지만 반복 호출 시 비용이 나가는 오류는 시도 횟수를 낮게 잡는다.
LOW_BUDGET_EXCEPTIONS = (VerdictParseError,)

DEFAULT_MAX_ATTEMPTS = 5
LOW_MAX_ATTEMPTS = 2


def is_retryable(exc: Exception) -> bool:
    return isinstance(exc, RETRYABLE_EXCEPTIONS)


def retry_budget_for(exc: Exception) -> int:
    """이 예외로 큐잉할 때 허용할 최대 재시도 횟수."""
    if isinstance(exc, LOW_BUDGET_EXCEPTIONS):
        return LOW_MAX_ATTEMPTS
    return DEFAULT_MAX_ATTEMPTS
