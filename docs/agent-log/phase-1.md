# Phase 1 report — backend + structured data (2026-10-06 / 07)

**Status: complete on the code side; backend parts below are marked "awaiting local run" until you report `dotnet build/test`
and the Docker run.** Nothing here has been compiled by me (no .NET SDK in my environment) — that was agreed in Q2.

## What now exists
| Area | Result | Verified |
|---|---|---|
| Solution + local infra | `backend/GuitarApp.sln` (4 src + 5 test projects + importer), root `docker-compose.yml` (Postgres 17, Azurite, **api**), `.env.example` | build/tests ran for 1.1–1.4 (80/80) |
| Data model | Artist, Album, Tuning, Song, Chord, ChordVoicing (+`frets_source`), Scale/Position/Note, MusicConcept, Technique, gear tables; jsonb localized text; 3 EF migrations | migrations 1–3 applied by you |
| Importer | idempotent, all-or-nothing, `--dry-run`, `import-report.json`; chords-db voicings with provenance | real run: 0 errors (638 chords, 4,911 voicings, 20 songs, 18 artists, 10 concepts, 2 scales) |
| Chord data | tombatossals/chords-db 0.5.1 (MIT), data only, sha256-pinned, midi-cross-checked; 594 chords / 2,367 diagrams in the web app | web typecheck + in-process checks |
| Read API | `/api/songs`, `/api/artists`, `/api/tunings`, `/api/chords` (+`/library`), `/api/scales`, `/api/concepts`; paging, filters, problem+json | **awaiting local build/test** |
| API tests | `Api.Tests` (Testcontainers, skipped without Docker) | **awaiting local run** |
| Docker | `backend/Dockerfile`, compose `api` service, Swagger via `Swagger__Enabled` | **awaiting local run** |
| Web data switch | `VITE_DATA_SOURCE=local|api`, `VITE_API_URL`; chord library + built-in songs; loading/error UI in 5 languages | typecheck exit 0; round-trip check OK |
| Parity | `npm run data:parity` | verified against a mock API; needs the real one |

## How to run it
```
docker compose up -d --build api          # repo root: Postgres + API (migrates on start)
dotnet run --project backend/tools/GuitarApp.Importer      # loads the data (first time / after seed changes)
# http://localhost:5080/swagger , http://localhost:5080/api/songs
cd web && npm run data:parity             # local seed == API ?
# web app on the API:  VITE_DATA_SOURCE=api  (in web/.env), then npm run dev
```

## Deviations from AGENT_PLAN.md (all logged in DECISIONS.md)
- Exercises are not in the API yet (Phase 3, learning model). Concepts/scales are served but the web app still reads them locally.
- Rights fields / Tab tables belong to Phase 2 with the blob work.
- Chord data: the original CSV held finger numbers, not frets (pre-existing bug) → chords-db replaced it as the source of frets; 44 CSV-only chord types stay hidden in the web app and finger-only in the DB.

## Risks / things to watch
- First `dotnet build`/`test` of the new API code may need small fixes (EF translation of a few projections, controller return types, test host connection string).
- Git writes from my VM corrupted refs once (see DECISIONS 2026-10-07) — commit/push from your machine and run `git fsck`.
- User data (progress, custom songs, sessions) is still localStorage until Phase 4.

## Needs your decision before Phase 2
1. Keep or drop the 44 CSV-only chord types in the DB?
2. Concepts/scales from the API in the web app now, or in the learning-model phase?
3. Go-ahead for Phase 2 (tab files → Azurite, rights fields, access policy).
