"""
어떤 예외가 '네트워크 오류'로 재처리 큐에 들어갈 수 있는지 판단한다.
- 네트워크/일시적 오류 (연결 끊김, 타임아웃, 레이트리밋, OpenAI 서버 5xx)
  -> 재시도 가능. 사용자의 재촬영 횟수를 차감하지 않고 큐에 저장한다.
- 그 외 (손상된 파일로 ffmpeg가 실패하는 등)
  -> 재시도해도 똑같이 실패하므로 즉시 실패 처리하고, 사용자 재촬영 횟수를 차감한다.
"""
import openai

RETRYABLE_EXCEPTIONS = (
    openai.APIConnectionError,
    openai.APITimeoutError,
    openai.RateLimitError,
    openai.InternalServerError,
)


def is_retryable(exc: Exception) -> bool:
    return isinstance(exc, RETRYABLE_EXCEPTIONS)
