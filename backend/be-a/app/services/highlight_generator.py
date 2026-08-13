import os
import shutil
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Optional
from urllib.parse import unquote, urlparse

import httpx
from PIL import Image, ImageDraw, ImageFont

from app.schemas.highlight import HighlightClip, HighlightGenerateRequest
from app.schemas.common import ExternalId


class HighlightGenerationError(RuntimeError):
    pass


class HighlightSourceError(HighlightGenerationError):
    pass


class HighlightSourceFetcher:
    MAX_SOURCE_BYTES = 20 * 1024 * 1024
    ALLOWED_SUFFIXES = {".mp4", ".mov"}

    def fetch(self, source_url: str, destination_dir: Path, clip_id: ExternalId) -> Path:
        parsed = urlparse(source_url)
        if parsed.scheme == "file":
            if os.getenv("APP_ENV", "local") not in {"local", "test"}:
                raise HighlightSourceError("file URL은 로컬·테스트 환경에서만 허용됩니다.")
            source_path = Path(unquote(parsed.path)).resolve()
            if not source_path.is_file():
                raise HighlightSourceError("클립 파일을 찾을 수 없습니다.")
            if source_path.suffix.lower() not in self.ALLOWED_SUFFIXES:
                raise HighlightSourceError("MP4 또는 MOV 클립만 사용할 수 있습니다.")
            if source_path.stat().st_size > self.MAX_SOURCE_BYTES:
                raise HighlightSourceError("클립 파일은 최대 20MB까지 허용됩니다.")
            return source_path

        if parsed.scheme not in {"http", "https"}:
            raise HighlightSourceError("sourceUrl은 HTTP(S) URL이어야 합니다.")

        suffix = Path(parsed.path).suffix.lower()
        if suffix not in self.ALLOWED_SUFFIXES:
            suffix = ".mp4"
        destination = destination_dir / f"source-{clip_id}{suffix}"

        try:
            with httpx.stream("GET", source_url, timeout=20.0, follow_redirects=True) as response:
                response.raise_for_status()
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > self.MAX_SOURCE_BYTES:
                    raise HighlightSourceError("클립 파일은 최대 20MB까지 허용됩니다.")

                downloaded = 0
                with destination.open("wb") as output:
                    for chunk in response.iter_bytes():
                        downloaded += len(chunk)
                        if downloaded > self.MAX_SOURCE_BYTES:
                            raise HighlightSourceError("클립 파일은 최대 20MB까지 허용됩니다.")
                        output.write(chunk)
        except httpx.HTTPError as exc:
            raise HighlightSourceError("클립 다운로드에 실패했습니다.") from exc

        return destination


class FFmpegHighlightGenerator:
    WIDTH = 1080
    HEIGHT = 1920
    FPS = 30
    CLIP_SECONDS = 5
    TITLE_SECONDS = 2

    def __init__(
        self,
        output_dir: Optional[Path] = None,
        public_base_url: Optional[str] = None,
    ):
        self.ffmpeg = shutil.which("ffmpeg")
        self.ffprobe = shutil.which("ffprobe")
        if not self.ffmpeg or not self.ffprobe:
            raise HighlightGenerationError("FFmpeg와 FFprobe가 필요합니다.")

        configured_dir = output_dir or Path(
            os.getenv("HIGHLIGHT_OUTPUT_DIR", "generated/highlights")
        )
        self.output_dir = Path(configured_dir).resolve()
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.public_base_url = (
            public_base_url or os.getenv("PUBLIC_BASE_URL", "http://localhost:8001")
        ).rstrip("/")
        self.font_path = self._resolve_font_path()

    def generate(
        self,
        request: HighlightGenerateRequest,
        fetcher: HighlightSourceFetcher,
    ) -> tuple[Path, float, str]:
        output_path = self.output_dir / f"highlight-{request.highlight_id}.mp4"
        scene_budget = request.max_duration_seconds - self.TITLE_SECONDS
        seconds_per_scene = min(
            self.CLIP_SECONDS,
            scene_budget / len(request.clips),
        )

        with TemporaryDirectory(prefix="welllog-highlight-") as temp_name:
            temp_dir = Path(temp_name)
            title_path = temp_dir / "scene-title.mp4"
            title_image = temp_dir / "title.png"
            self._render_text_image(request.title, title_image, card=True)
            self._create_completion_card(
                title_path,
                title_image,
                self.TITLE_SECONDS,
            )
            normalized_paths: list[Path] = [title_path]

            for index, clip in enumerate(request.clips):
                normalized = temp_dir / f"scene-{index:02d}.mp4"
                caption_image = temp_dir / f"caption-{index:02d}.png"
                self._render_text_image(
                    clip.caption,
                    caption_image,
                    card=not clip.shared,
                )

                if clip.shared:
                    source = fetcher.fetch(clip.source_url or "", temp_dir, clip.clip_id)
                    self._normalize_clip(source, normalized, caption_image, seconds_per_scene)
                else:
                    self._create_completion_card(normalized, caption_image, seconds_per_scene)
                normalized_paths.append(normalized)

            self._concat(normalized_paths, output_path)

        duration = min(self._probe_duration(output_path), float(request.max_duration_seconds))
        video_url = f"{self.public_base_url}/generated/highlights/{output_path.name}"
        return output_path, duration, video_url

    @staticmethod
    def _resolve_font_path() -> str:
        configured = os.getenv("HIGHLIGHT_FONT_PATH")
        candidates = [
            configured,
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        for candidate in candidates:
            if candidate and Path(candidate).is_file():
                return candidate
        raise HighlightGenerationError("하이라이트 자막에 사용할 폰트 파일이 필요합니다.")

    def _normalize_clip(
        self,
        source: Path,
        destination: Path,
        caption_image: Path,
        duration: float,
    ) -> None:
        filters = (
            f"[0:v]scale={self.WIDTH}:{self.HEIGHT}:force_original_aspect_ratio=decrease,"
            f"pad={self.WIDTH}:{self.HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x11161E,"
            f"fps={self.FPS},setsar=1[base];"
            "[base][1:v]overlay=0:0:format=auto,format=yuv420p[video]"
        )
        self._run(
            [
                self.ffmpeg,
                "-y",
                "-i",
                str(source),
                "-loop",
                "1",
                "-i",
                str(caption_image),
                "-t",
                f"{duration:.3f}",
                "-filter_complex",
                filters,
                "-map",
                "[video]",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(destination),
            ]
        )

    def _create_completion_card(
        self,
        destination: Path,
        card_image: Path,
        duration: float,
    ) -> None:
        self._run(
            [
                self.ffmpeg,
                "-y",
                "-loop",
                "1",
                "-framerate",
                str(self.FPS),
                "-i",
                str(card_image),
                "-t",
                f"{duration:.3f}",
                "-vf",
                f"fps={self.FPS},setsar=1,format=yuv420p",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(destination),
            ]
        )

    def _render_text_image(self, text: str, destination: Path, card: bool) -> None:
        if card:
            image = Image.new("RGB", (self.WIDTH, self.HEIGHT), (36, 43, 54))
        else:
            image = Image.new("RGBA", (self.WIDTH, self.HEIGHT), (0, 0, 0, 0))

        draw = ImageDraw.Draw(image)
        font_size = 64 if card else 48
        font = ImageFont.truetype(self.font_path, font_size)
        wrapped = self._wrap_text(draw, text, font, self.WIDTH - 160)
        bounds = draw.multiline_textbbox(
            (0, 0),
            wrapped,
            font=font,
            spacing=16,
            align="center",
        )
        text_width = bounds[2] - bounds[0]
        text_height = bounds[3] - bounds[1]
        x = (self.WIDTH - text_width) // 2
        y = (self.HEIGHT - text_height) // 2 if card else self.HEIGHT - text_height - 170
        padding_x = 32
        padding_y = 24
        draw.rounded_rectangle(
            (
                x - padding_x,
                y - padding_y,
                x + text_width + padding_x,
                y + text_height + padding_y,
            ),
            radius=20,
            fill=(0, 0, 0, 150) if not card else (17, 22, 30),
        )
        draw.multiline_text(
            (x, y - bounds[1]),
            wrapped,
            font=font,
            fill="white",
            spacing=16,
            align="center",
        )
        image.save(destination, "PNG")

    @staticmethod
    def _wrap_text(
        draw: ImageDraw.ImageDraw,
        text: str,
        font: ImageFont.FreeTypeFont,
        max_width: int,
    ) -> str:
        lines = []
        for paragraph in text.splitlines() or [text]:
            current = ""
            for character in paragraph:
                candidate = current + character
                width = draw.textbbox((0, 0), candidate, font=font)[2]
                if current and width > max_width:
                    lines.append(current.rstrip())
                    current = character.lstrip()
                else:
                    current = candidate
            lines.append(current.rstrip())
        return "\n".join(line for line in lines if line) or "미션 완료"

    def _concat(self, sources: list[Path], destination: Path) -> None:
        concat_file = sources[0].parent / "concat.txt"
        lines = []
        for source in sources:
            escaped_path = str(source).replace("'", "'\\''")
            lines.append(f"file '{escaped_path}'")
        concat_file.write_text("\n".join(lines), encoding="utf-8")
        self._run(
            [
                self.ffmpeg,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c",
                "copy",
                "-movflags",
                "+faststart",
                str(destination),
            ]
        )

    def _probe_duration(self, video_path: Path) -> float:
        result = self._run(
            [
                self.ffprobe,
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(video_path),
            ]
        )
        return round(float(result.stdout.strip()), 3)

    @staticmethod
    def _run(command: list[str]) -> subprocess.CompletedProcess[str]:
        try:
            return subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                timeout=120,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            stderr = getattr(exc, "stderr", "") or ""
            raise HighlightGenerationError(
                f"FFmpeg 영상 처리에 실패했습니다: {stderr[-500:]}"
            ) from exc
