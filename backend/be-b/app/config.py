import os
from pathlib import Path


class Settings:
    """환경변수를 한 곳에서 읽는다. 값은 매번 os.getenv에서 읽어와 테스트에서
    os.environ을 바꿔가며 검증할 수 있게 한다."""

    @property
    def openai_api_key(self) -> str:
        return os.getenv("OPENAI_API_KEY", "").strip()

    @property
    def openai_vision_model(self) -> str:
        return os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")

    @property
    def be_a_base_url(self) -> str:
        return os.getenv("BE_A_BASE_URL", "").rstrip("/")

    @property
    def internal_api_key(self) -> str:
        return os.getenv("INTERNAL_API_KEY", "").strip()

    @property
    def daily_ai_judgement_limit(self) -> int:
        return int(os.getenv("DAILY_AI_JUDGEMENT_LIMIT", "10"))

    @property
    def max_fail_retry_count(self) -> int:
        return int(os.getenv("MAX_FAIL_RETRY_COUNT", "3"))

    @property
    def max_total_attempt_count(self) -> int:
        return int(os.getenv("MAX_TOTAL_ATTEMPT_COUNT", "6"))

    @property
    def max_upload_mb(self) -> int:
        return int(os.getenv("MAX_UPLOAD_MB", "20"))

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def shared_clip_retention_hours(self) -> int:
        return int(os.getenv("SHARED_CLIP_RETENTION_HOURS", "24"))

    @property
    def storage_root(self) -> Path:
        return Path(os.getenv("STORAGE_ROOT", "storage"))

    @property
    def public_base_url(self) -> str:
        return os.getenv("PUBLIC_BASE_URL", "http://localhost:8002").rstrip("/")

    @property
    def database_path(self) -> str:
        return os.getenv("DATABASE_PATH", "storage/clips.db")


settings = Settings()
