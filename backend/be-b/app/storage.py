import shutil
from pathlib import Path
from typing import BinaryIO

from fastapi import UploadFile

from app.config import settings
from app.errors import FILE_001_INVALID_TYPE, FILE_002_TOO_LARGE, ApiException

ALLOWED_EXTENSIONS = {".mp4", ".mov"}
ALLOWED_CONTENT_TYPES = {"video/mp4", "video/quicktime"}
_CHUNK_SIZE = 1024 * 1024


def validate_clip_file(upload: UploadFile) -> str:
    """확장자를 검증하고 정규화된 확장자를 반환한다."""
    suffix = Path(upload.filename or "").suffix.lower()
    content_type = (upload.content_type or "").lower()

    if suffix in ALLOWED_EXTENSIONS:
        return suffix
    if content_type in ALLOWED_CONTENT_TYPES:
        return ".mp4" if content_type == "video/mp4" else ".mov"

    raise ApiException(FILE_001_INVALID_TYPE, message="MP4 또는 MOV 형식의 영상만 업로드할 수 있습니다.")


def save_clip_file(upload: UploadFile, clip_id: int, extension: str) -> Path:
    """업로드 스트림을 저장하면서 용량 제한을 검사한다. 초과 시 FILE-002."""
    clips_dir = settings.storage_root / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)
    destination = clips_dir / f"{clip_id}{extension}"

    max_bytes = settings.max_upload_bytes
    written = 0
    try:
        with destination.open("wb") as out_file:
            while chunk := upload.file.read(_CHUNK_SIZE):
                written += len(chunk)
                if written > max_bytes:
                    raise ApiException(
                        FILE_002_TOO_LARGE,
                        message=f"업로드 파일 크기는 {settings.max_upload_mb}MB를 초과할 수 없습니다.",
                    )
                out_file.write(chunk)
    except ApiException:
        destination.unlink(missing_ok=True)
        raise
    finally:
        upload.file.close()

    return destination


def frame_path(clip_id: int, frame_order: int) -> Path:
    frames_dir = settings.storage_root / "frames" / str(clip_id)
    frames_dir.mkdir(parents=True, exist_ok=True)
    return frames_dir / f"{frame_order}.jpg"


def to_public_url(path: Path) -> str:
    relative = path.relative_to(settings.storage_root).as_posix()
    return f"{settings.public_base_url}/files/{relative}"


def delete_clip_assets(source_clip_path: str, clip_id: int) -> None:
    """원본 클립 파일과 해당 클립의 프레임 디렉터리를 삭제한다."""
    clip_file = Path(source_clip_path)
    clip_file.unlink(missing_ok=True)

    frames_dir = settings.storage_root / "frames" / str(clip_id)
    shutil.rmtree(frames_dir, ignore_errors=True)


def save_frame_bytes(clip_id: int, frame_order: int, data: BinaryIO) -> Path:
    destination = frame_path(clip_id, frame_order)
    with destination.open("wb") as out_file:
        shutil.copyfileobj(data, out_file)
    return destination
