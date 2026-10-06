# Phase 1 progress (running log — not yet a checkpoint)

| Task | Status |
|---|---|
| Prereq (Q3): finish i18n, push, typecheck | **done** — `tsc -b --force` exit 0 on device (91 files) |
| Prereq (Q1): seed export script | **done & verified here** — 27/20/18/1/10/496/2,554/4 records, deterministic |
| 1.1 Solution + docker-compose (Postgres, Azurite) + `/health` | **written — awaiting local `dotnet build/test`** (8 projects, root `docker-compose.yml`, `.env.example`, `/health` + `/health/ready`) |
| 1.2 EF Core, snake_case, interceptor, ProblemDetails, Swagger, CORS | **written — awaiting local build** (Npgsql + EFCore.NamingConventions, `TimestampInterceptor`, `GlobalExceptionHandler`, built-in OpenAPI + Swagger UI, CORS from config) |
| 1.3 Entities + initial migration (+ rights fields, jsonb localized text) | **entities + configurations written; migration NOT generated** — you generate it (`dotnet ef migrations add InitialCreate …`, see `backend/README.md`). Rights fields belong to `Tab`/`TabVersion`, which arrive in Phase 2 (decision below). |
| 1.4 Domain validation + unit tests | **written — awaiting local `dotnet test`** (Domain, Application, Infrastructure model, API health tests) |
| 1.5 Importer (idempotent, `import-report.json`) | **written — awaiting local build/test** (`tools/GuitarApp.Importer`, `GuitarApp.Importer.Tests`; needs a 2nd EF migration — see README). Earlier tasks 1.1–1.4: **verified locally** (build OK, `InitialCreate` applied, 80/80 tests pass) |
| 1.5b chords-db real frets (web generator + web library + importer pass + `frets_source`) | **web: done, typecheck exit 0 + data sanity run on device; backend: written — awaiting local build/test + migration #3** |
| 1.6 Read endpoints (songs, artists, tunings, chords + `/library`, scales, concepts) | **written — awaiting local build** (`Application/{Catalog,Reference}` contracts, `Infrastructure/Queries`, `Api/Controllers`) |
| 1.7 API integration tests + `backend/Dockerfile` + compose `api` service | **written — awaiting local build/test** (`Api.Tests/ApiFixture.cs`, `ReadEndpointTests.cs`, Testcontainers; skipped without Docker) |
| 1.8–1.9 Frontend data-access layer + `VITE_DATA_SOURCE` | **in progress** — foundation done (typecheck exit 0): `services/dataSource.ts`, `services/api/{client,types,catalogApi}.ts`, `chordLibrary.ts` refactor (`shapeFromFrets`, `libraryFromRows`, `groupByRoot`, `findChordByName`). **Not wired yet:** hooks, components, i18n keys, env typing, web Dockerfile ARGs |
| 1.10 Parity script | not started |

Backend tasks will be marked "written — awaiting local `dotnet build/test`" until you report results (Q2).
