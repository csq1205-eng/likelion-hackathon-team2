# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Welllog BE B — the media pipeline & vision judgment service for a wellness-challenge app. It accepts a
video clip proving a user completed a mission, extracts a few frames, sends them to `gpt-4o-mini` to
judge pass/hold/fail, and enforces two policies: a per-mission retake limit and a 24-hour clip retention
policy. Owner: 강원모. This is one backend among several (BE A generates highlight/verdict-reason text
from this service's output, BE C owns the main DB in Java/Spring, FE D/E are frontend clients) — see
"Cross-service contracts" below.

## Commands

```bash
# Install deps (also requires ffmpeg on PATH: brew install ffmpeg / apt install ffmpeg)
pip install -r requirements.txt

# Env
cp .env.example .env   # fill in OPENAI_API_KEY
export $(cat .env | xargs)

# Run the API (Swagger UI at http://localhost:8000/docs)
uvicorn main:app --reload

# Run all tests (no pytest — plain scripts with assert, run individually)
python3 tests/test_retention_policy.py     # 5 tests — 24h purge policy logic
python3 tests/test_retry_queue.py          # 5 tests — network-error retry queue logic
python3 tests/test_frame_extraction.py     # 2 tests — real ffmpeg frame extraction (E2E)
python3 tests/test_api.py                  # 7 tests — FastAPI TestClient, full HTTP flow

# Live OpenAI integration smoke test (needs real OPENAI_API_KEY + network access to
# api.openai.com, which this dev sandbox does NOT have — run this locally instead)

# bash / macOS / Linux
export OPENAI_API_KEY=sk-...
python3 scripts/live_smoke_test.py

# PowerShell (Windows)
$env:OPENAI_API_KEY = "sk-..."
python scripts\live_smoke_test.py
```

There is no test runner/framework — each test file is a standalone script using bare `assert` and a
`if __name__ == "__main__"` loop over functions named `test_*`. To run a single test, import the file and
call the function directly, or temporarily trim the `tests` list at the bottom of the file.

`test_frame_extraction.py` and `test_api.py` exercise real ffmpeg/DB/FastAPI routing and only mock the
OpenAI call. `test_retention_policy.py` and `test_retry_queue.py` are pure logic tests against fake rows.
`live_smoke_test.py` is the only one that hits the real OpenAI API — it validates that the integration
and response schema work, not that the verdict is accurate (a synthetic ffmpeg test pattern is used, so
pass/fail/hold outcomes are meaningless). Real accuracy validation is planned later against a ~65-clip
eval set.

## Architecture

**Request flow (upload path, `main.py`):** `POST /api/clips/upload` → check retry count against
`MAX_MISSION_RETRIES` (3) → save uploaded file → `pipeline.process_clip()` → on success, record the clip
in `db` (this starts the 24h retention clock) and return the verdict; on a retryable exception, enqueue an
`upload_jobs` row and return 202 instead of failing.

**Shared pipeline (`pipeline.py`):** `process_clip()` = `frame_extraction.extract_frames()` +
`vision_judge.judge_mission()`. This function is intentionally the single place both the upload endpoint
(`main.py`) and the retry-queue scheduler (`scheduler.py`) call, so judgment logic only ever needs to
change in one spot.

**Retryable-error classification (`errors.py`):** `is_retryable()` distinguishes transient OpenAI errors
(connection drop, timeout, rate limit, 5xx) from everything else. Retryable errors go to the
`upload_jobs` queue and do **not** decrement the user's retake count. Non-retryable errors (e.g. a
corrupted file ffmpeg can't read) fail immediately and **do** count against the user's retakes — retrying
them would just fail again.

**Retry queue (`db.py` `upload_jobs` table + `scheduler.py` `retry_pending_uploads`):** runs every 2
minutes. For each pending job: retryable failure → increment `attempts`, stay pending (or flip to
`failed` + charge the user's retake count once `attempts >= max_attempts`, default 5); non-retryable
failure → `failed` immediately + charge retake count; success → create the clip record (starts retention
clock) and mark the job `completed`.

**Retention/purge policy (`retention_policy.py` `should_purge()` + `scheduler.py` `purge_expired_clips`,
runs every 5 minutes):**
- Clock starts at judgment completion (`clips.judgment_completed_at`), not upload time.
- Non-shared clip: purged immediately once BE A calls back via `POST
  /api/clips/{clip_id}/highlight-complete`.
- Shared clip: kept until the user explicitly `DELETE`s it.
- Hard cap: **any** clip (shared or not) is purged once 24h have passed since judgment, regardless of the
  above — this is a safety net for missed callbacks, enforced by the periodic scheduler rather than at
  request time.

**Storage (`db.py`):** SQLite at `storage/clips.db`, three tables — `clips` (retention state),
`retry_counts` (per-mission retake counter, survives restarts), `upload_jobs` (retry queue). This is
intentionally BE B's own store, not shared with BE C. Given the Python (BE A+B) / Java (BE C) service
split confirmed 8/3, this will NOT be migrated into BE C's DB — only the final verdict result crosses the
service boundary via API.

**Models (`models.py`):** `VerdictResponse` / `Criterion` are the shared judgment schema used across
`vision_judge.py`, `pipeline.py`, `db.py` (serialized as `verdict_json` in `upload_jobs`), and the API
response. `model_notes` is internal-only (used by BE A to generate the user-facing reason sentence) — not
meant to be shown to end users directly.

**Vision judgment (`vision_judge.py`):** frames are base64-encoded and sent to `gpt-4o-mini` with
`response_format={"type": "json_object"}` and a fixed system prompt requiring pass/hold/fail +
criteria + confidence + model_notes. The OpenAI client is lazily constructed (`_get_client()`) so
importing this module never requires `OPENAI_API_KEY` to be set — this is why the mocked tests can import
it freely.

## Cross-service contracts

- BE A depends on `model_notes` in `VerdictResponse` to generate the natural-language verdict-reason
  shown to users.
- BE A calls `POST /api/clips/{clip_id}/highlight-complete` when it finishes generating a highlight; this
  is what triggers immediate purge for non-shared clips.
- Frame extraction currently runs server-side (frame_extraction.py) via ffmpeg. 
Client-side extraction was discussed as a bandwidth optimization but is NOT 
yet confirmed with FE — do not assume this without checking.

## Known gotchas

- `requirements.txt` pins `openai==1.109.1` — an earlier pin (`1.51.0`) was incompatible with modern
  `httpx` (0.28+) and broke client construction. If you see client-init failures after installing, run
  `pip install -r requirements.txt --upgrade`.
- The dev sandbox this repo is normally developed in has no network access to `api.openai.com` —
  `scripts/live_smoke_test.py` must be run locally with a real key, not in-sandbox.