# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Welllog BE B — the media pipeline & vision judgment service for a wellness-challenge app. It accepts a
video clip proving a user completed a mission, extracts a few frames, sends them to `gpt-4o-mini` to
judge pass/hold/fail, applies a confidence-threshold policy, and enforces two policies: a per-mission
retake limit and a 24-hour clip retention policy. Owner: 강원모. This is one backend among several
(BE A generates highlight/verdict-reason text from this service's output, BE C owns the main DB in
Java/Spring, FE D/E are frontend clients) — see "Cross-service contracts" below.

## Commands

```bash
# Install deps (also requires ffmpeg on PATH: brew install ffmpeg / apt install ffmpeg)
pip install -r requirements.txt

# Env
cp .env.example .env   # fill in OPENAI_API_KEY (everything else is optional)
export $(cat .env | xargs)

# Run the API (Swagger UI at http://localhost:8000/docs)
uvicorn main:app --reload

# Run all tests (no pytest — plain scripts with assert, run individually)
python3 tests/test_retention_policy.py     # 24h purge policy logic
python3 tests/test_retry_queue.py          # network-error retry queue logic
python3 tests/test_frame_extraction.py     # real ffmpeg frame extraction (E2E)
python3 tests/test_api.py                  # FastAPI TestClient, full HTTP flow

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
and response schema work, not that the verdict is accurate. Real accuracy validation is planned later
against a ~65-clip eval set.

## Architecture

**Request flow (upload path, `main.py`):** `POST /api/clips/upload` → check `retry_counts.count` against
`MAX_MISSION_RETRIES` (3) and `retry_counts.total_attempts` against `MAX_TOTAL_ATTEMPTS` (6) → stream the
upload to disk under a `MAX_UPLOAD_MB` cap → `pipeline.process_clip()` → on success, record the clip in
`db` (this starts the 24h retention clock) and return the verdict; on a retryable exception, enqueue an
`upload_jobs` row and return 202; on a non-retryable exception, **purge the clip file** and return 422.

All endpoints are **synchronous `def`, not `async def`.** They perform blocking ffmpeg / OpenAI / SQLite
calls, so `async def` would occupy the event loop and stall the whole server (including `/health`) for
the 10–15s of every upload. Keeping them sync makes FastAPI run them in a threadpool. Do not "fix" this
by adding `async`.

**Shared pipeline (`pipeline.py`):** `process_clip()` = `frame_extraction.extract_frames()` +
`vision_judge.judge_mission()` + `judgment_policy.apply()`, wrapped in a `try/finally` that **always**
deletes the extracted frames. This function is intentionally the single place both the upload endpoint
(`main.py`) and the retry-queue scheduler (`scheduler.py`) call.

**Threshold policy (`judgment_policy.py`):** converts the model's raw verdict into the final verdict.
A low-confidence `pass` becomes `hold`; a low-confidence `fail` also becomes `hold` (so an uncertain
model doesn't burn the user's retake count). If the mission supplied fixed `criteria`, all must be met
for `pass`. This is the only tuning knob surface — bump `POLICY_VERSION` when changing thresholds so
eval-set benchmarks stay comparable. The response carries `raw_verdict`, `policy_version`, `policy_note`
as optional diagnostic fields.

**Retryable-error classification (`errors.py`):** `is_retryable()` covers transient OpenAI errors
(connection drop, timeout, rate limit, 5xx) **and** `VerdictParseError` (the model violated the JSON
schema — not the user's fault). `retry_budget_for()` gives parse errors a lower budget (2 vs 5) so a
persistently unparseable input can't burn credits. Non-retryable errors (`FrameExtractionError` from a
corrupted file) fail immediately, charge the user's retake count, and purge the clip file.

**Retry queue (`db.py` `upload_jobs` + `scheduler.py` `retry_pending_uploads`):** runs every 2 minutes
with `max_instances=1` so ticks never overlap. For each pending job: retryable failure → increment
`attempts`, stay pending (or flip to `failed` + charge retake count + **purge the clip file** once
`attempts >= max_attempts`); non-retryable → `failed` + charge + purge; success → create the clip record
and mark the job `completed`. The success path is wrapped so that a bookkeeping failure can never leave
the job `pending` (which would re-judge the same clip next tick and double-charge OpenAI).

**Retention/purge policy (`retention_policy.py` `should_purge()` + `scheduler.py` `purge_expired_clips`,
runs every 5 minutes):**
- Clock starts at judgment completion (`clips.judgment_completed_at`), not upload time.
- **Extracted frames are purged separately and immediately** in `pipeline.py`'s `finally` — they are a
  distinct piece of personal data from the source clip. `purge_clip_assets()` cleans both and is the only
  purge entry point; never call `os.remove` on a clip directly.
- Non-shared clip: purged once BE A calls `POST /api/clips/{clip_id}/highlight-complete` — **but only if
  the user has already made a share decision** (`clips.share_decided`). Otherwise purge is deferred by
  `SHARE_DECISION_GRACE_MINUTES` so a callback arriving before the user taps "share" doesn't destroy the
  clip first.
- `fail`/`hold` clips are not highlight candidates, so they're purged early rather than held for 24h.
- Shared clip: kept until the user explicitly `DELETE`s it.
- Hard cap: **any** clip is purged 24h after judgment regardless of the above.
- If file deletion fails, the row is **not** marked deleted, so the next tick retries.

**Storage (`db.py`):** SQLite at `storage/clips.db` (WAL mode + 10s busy timeout, since the request
threadpool and the scheduler thread both write). Three tables — `clips` (retention state),
`retry_counts` (per-mission retake counters, survives restarts), `upload_jobs` (retry queue).
`init_db()` performs additive column migrations via `PRAGMA table_info` + `ALTER TABLE`, so an existing
db file doesn't need to be deleted. This is intentionally BE B's own store, not shared with BE C
(confirmed 8/3) — only the final verdict crosses the service boundary via API.

**Retake counters:** `count` is charged only on a real `fail` or a non-retryable error, and is **reset to
0 on `pass`**. `total_attempts` is verdict-independent and caps total judgment calls per mission — this
is the cost guard against unlimited `hold` retries.

**Models (`models.py`):** `VerdictResponse` / `Criterion` are the shared judgment schema. The originally
agreed required fields are unchanged; `raw_verdict` / `policy_version` / `policy_note` were added as
optional fields with defaults so BE A's parser doesn't break. `model_notes` is internal-only.

**Vision judgment (`vision_judge.py`):** frames are base64-encoded and sent with
`response_format={"type": "json_schema", strict: true}` (falls back once to `json_object` if the model
rejects it). All parsing goes through `_parse()`, which raises `VerdictParseError` rather than
`KeyError`/`ValidationError` so schema violations are queued instead of charged to the user. The client
is lazily constructed with an explicit 30s timeout and `max_retries=0` (our queue owns retries; SDK
retries would silently double-charge). Optional per-mission `criteria` are injected into the prompt so
the model fills in fixed ids instead of inventing new ones each call.

**Frame extraction (`frame_extraction.py`):** ffmpeg with a 30s timeout, downscaled to
`scale='min(768,iw)':-2` (never upscales) to cut image tokens and latency. All ffmpeg/ffprobe failures
are wrapped in `FrameExtractionError` (non-retryable). `cleanup_frames()` globs `{clip_id}_*.jpg`.

## Cross-service contracts

- BE A depends on `model_notes` in `VerdictResponse` to generate the natural-language verdict-reason
  shown to users.
- BE A calls `POST /api/clips/{clip_id}/highlight-complete` when it finishes generating a highlight.
  **Open question:** whether BE A guarantees this fires only after the user's share decision, or whether
  we rely on the grace window. Confirm with 최승환.
- **FE must call `PATCH /api/clips/{clip_id}/share` even when the user chooses NOT to share** — that is
  what sets `share_decided` and allows immediate purge.
- **Open question:** the scope of `mission_id`. If it's a mission-definition id rather than a
  per-user-per-day instance id, one user's failures block every user. Confirm with BE A/C.
- If `INTERNAL_API_KEY` is set, callers must send `X-Internal-Key`. `/health` is unauthenticated.
- Frame extraction currently runs server-side via ffmpeg. Client-side extraction was discussed as a
  bandwidth optimization but is **not** confirmed with FE — do not assume this without checking.

## Known gotchas

- `requirements.txt` pins `openai==1.109.1` — an earlier pin (`1.51.0`) was incompatible with modern
  `httpx` (0.28+) and broke client construction. If you see client-init failures after installing, run
  `pip install -r requirements.txt --upgrade`.
- The dev sandbox this repo is normally developed in has no network access to `api.openai.com` —
  `scripts/live_smoke_test.py` must be run locally with a real key, not in-sandbox.
- Do not add `async` to the API endpoints (see "Request flow" above).
- Do not delete clip files directly — use `retention_policy.purge_clip_assets()` so frames go too.
