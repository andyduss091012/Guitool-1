# Phase 1 — checkpoint 1 (2026-10-06, stopped for the day)

Not the final Phase 1 report. That is written after the remaining items below and the parity check (1.10).

## Verified by you (on your machine)
- `dotnet build`, `InitialCreate` + `ChordFingersAndConcepts` migrations applied, first 80 tests passed (earlier run).
- Importer ran for real: **0 errors**; created 1 tuning, 18 artists, 20 songs, 638 chords, 4,911 voicings (4 matched), 2 scales / 10 positions, 10 concepts. 5 expected warnings (hand-authored G/Am/C shapes added as extra preferred voicings).
- Web: typecheck exit 0; chord library shows 594 chords / 2,367 diagrams from chords-db + authored shapes (local data mode).

## Written but NOT yet compiled or run (no .NET SDK in my environment)
| Item | Where |
|---|---|
| `frets_source` provenance + importer pass for chords-db + tests | `Domain/Reference/ChordVoicing.cs`, `SeedImporter.cs`, tests. **Needs migration #3** (`ChordFretsSource`) — you reported the import OK, so this is already applied; re-run `dotnet test` to confirm the new tests. |
| Read API (1.6) | `Application/{Catalog,Reference}/*Contracts.cs`, `Infrastructure/Queries/*`, `Api/Controllers/*`, `Program.cs` (JSON null-omission, `Swagger:Enabled`) |
| API tests (1.7) | `tests/GuitarApp.Api.Tests/{ApiFixture,ReadEndpointTests}.cs` (+ Testcontainers/SkippableFact packages in the csproj) — need Docker running |
| Dockerfile + compose `api` service | `backend/Dockerfile`, `backend/.dockerignore`, root `docker-compose.yml`, `.env.example` (`API_PORT`) |

Things most likely to need a fix on first build (EF translation / compile): `s.Positions.Count()` and `c.Voicings.Any(...)` in projections, the filtered `Include(c => c.Voicings.Where(...))`, `ILike` on `Root + Quality`, the `ObjectResult` vs `ActionResult<T>` conversions in controllers, and `WebApplicationFactory` picking up the `ConnectionStrings__Postgres` environment variable in `ApiFixture`.

## Web work in progress (typecheck exit 0, but nothing uses it yet)
Done: `services/dataSource.ts`, `services/api/{client,types,catalogApi}.ts`, `chordLibrary.ts` refactor (`shapeFromFrets`, `windowStartFor`, `libraryFromRows`, `groupByRoot`, `findChordByName`).
Local mode behaves exactly as before.

## Tomorrow — in order
1. **You:** `cd backend` → `dotnet build` → `dotnet test` (Docker running) and paste any errors. Then `docker compose up -d --build api` (from the repo root) and open http://localhost:5080/swagger and http://localhost:5080/api/songs. If the DB is empty: `dotnet run --project tools/GuitarApp.Importer`.
2. **Me:** fix whatever the build/tests report.
3. **Me:** finish 1.8–1.9 — `hooks/useChordLibrary.ts`, `hooks/useBuiltInSongs.ts`, switch `ChordLibraryGrid`, `SongLyricsView`, `useGuitool`/`songLibrary` to them; loading/error text in 5 languages (`songsChords.loading`, `songsChords.loadError`, `songsChords.retry`); `vite-env.d.ts` + `web/.env.example` (`VITE_DATA_SOURCE`, `VITE_API_URL`); `ARG`/`ENV` lines in `web/Dockerfile` (it currently ignores the `VITE_TABS_SERVER_URL` build arg too).
4. **Me:** 1.10 parity script (compare local vs API: chord set + fret signatures, songs) and the final `docs/agent-log/phase-1.md` report.
5. Then Phase 2 (tab files → Azurite, rights fields) after your go-ahead.

## Open questions for you
- Keep the 44 CSV-only chords (power chords, m13, 13(#9) …) finger-only in the DB, or drop them?
- Do you want Concepts/scales read from the API in the web app now (needs an async loading layer), or leave it until the learning-model phase (current plan)?
