FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HIGHLIGHT_FONT_PATH=/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc \
    HIGHLIGHT_OUTPUT_DIR=/app/generated/highlights \
    MISSION_POLICY_RULES_PATH=/app/config/mission_policy_rules.json

WORKDIR /app

# FFmpeg/FFprobe와 한글 자막용 Noto CJK 폰트를 설치한다.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        fontconfig \
        fonts-noto-cjk \
    && test -x /usr/bin/ffmpeg \
    && test -x /usr/bin/ffprobe \
    && test -f "$HIGHLIGHT_FONT_PATH" \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY config ./config

RUN mkdir -p "$HIGHLIGHT_OUTPUT_DIR" \
    && useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 10000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
