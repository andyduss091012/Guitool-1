# Guitool backend (ASP.NET Core 10 + PostgreSQL)

Phase 1 scaffold of the migration described in `AGENT_PLAN.md`. Progress and decisions live in
[`../docs/agent-log/`](../docs/agent-log/) (`phase-1-progress.md`, `DECISIONS.md`).

> **Status:** written but **not yet compiled** — the authoring environment has no .NET SDK or NuGet access.
> Your first `dotnet build` / `dotnet test` is the first real verification. Paste any errors back and they get fixed.

## Prerequisites

- **.NET 10 SDK** — <https://dotnet.microsoft.com/download> (check with `dotnet --version`, expect `10.x`)
- **Docker Desktop** (Postgres + Azurite run in containers)
- Node 20+ is only needed for the existing `web/` app

## Layout

```
backend/
  GuitarApp.sln
  Directory.Build.props          shared settings (net10.0, nullable, implicit usings)
  src/
    GuitarApp.Domain             entities + validation; references nothing
    GuitarApp.Application        paging types now; use cases/services from Phase 1.6
    GuitarApp.Infrastructure     EF Core + Npgsql, entity configurations, interceptors
    GuitarApp.Api                ASP.NET Core host: /health, OpenAPI, Swagger UI, CORS, ProblemDetails
  tests/
    GuitarApp.Domain.Tests       pure unit tests
    GuitarApp.Application.Tests  paging
    GuitarApp.Infrastructure.Tests  EF model checks (offline — no database needed)
    GuitarApp.Api.Tests          WebApplicationFactory tests
    GuitarApp.Importer.Tests     seed-file checks + importer integration tests (real Postgres via Testcontainers; skipped if Docker is off)
  tools/GuitarApp.Importer     idempotent seed importer (console app) + the JSON seeds it reads (seed/)
```

Dependency direction: `Api → Application → Domain`, `Infrastructure → Application/Domain`. Domain depends on nothing.

## First run

From the repository root (`Guitool/`):

```bash
# 1. Local services (Postgres on 5432, Azurite on 10000-10002)
copy .env.example .env            # Windows (cmd);  PowerShell: Copy-Item .env.example .env;  bash: cp
docker compose up -d
docker compose ps                 # postgres should become "healthy"

# 2. Build + test
cd backend
dotnet restore
dotnet build
dotnet test

# 3. Create the database schema (one-time: generate the first migration)
dotnet tool install --global dotnet-ef          # skip if already installed
dotnet ef migrations add InitialCreate -p src/GuitarApp.Infrastructure -s src/GuitarApp.Api -o Persistence/Migrations
dotnet ef database update            -p src/GuitarApp.Infrastructure -s src/GuitarApp.Api

# 4. Run the API
dotnet run --project src/GuitarApp.Api
```

Then open:

- <http://localhost:5080/health> → `Healthy` (process is up; no database needed)
- <http://localhost:5080/health/ready> → `Healthy` once Postgres is reachable, otherwise `503`
- <http://localhost:5080/swagger> → Swagger UI (Development only), OpenAPI JSON at `/openapi/v1.json`

`appsettings.Development.json` (git-ignored; copy from `appsettings.Development.example.json`) holds the local
connection string and sets `Database:MigrateOnStartup=true`, so after the first migration exists the API also applies
pending migrations when it starts. Production sets the connection string through the environment instead:
`ConnectionStrings__Postgres=...`.

## Importing the built-in content (Phase 1.5)

The web app's built-in songs, chords and concepts are exported to JSON (`node scripts/export-seed.mjs` in `web/`) and
loaded into Postgres by the importer. It is **idempotent** (re-running changes nothing) and **all-or-nothing**
(one invalid record means nothing is saved).

```bash
# after the database schema is up to date (dotnet ef database update …)
dotnet run --project tools/GuitarApp.Importer -- --dry-run     # validate + report, writes nothing
dotnet run --project tools/GuitarApp.Importer                  # import
```

It prints a per-table summary and writes `import-report.json` (git-ignored) in the current folder: records seeded,
created, updated, deleted, unchanged, plus warnings and errors. Options: `--seed <dir>`, `--connection "<string>"`,
`--report <file>`. The connection string comes from `--connection`, then `ConnectionStrings__Postgres`, then
`src/GuitarApp.Api/appsettings.Development.json`.

What lands where: artists, songs (with localized practice notes), the standard tuning, 638 chords (496 from the CSV
library + 142 only chords-db has) with their voicings, 2 scales with their 10 fretboard positions, and the 10 authored
teaching concepts (`music_concepts`, shapes kept verbatim as JSON).

> **The chord library stores fingerings, not frets.** The source dataset (`chord-fingers.csv`) holds finger numbers
> (`2,1,0,0,0,3` is open G played with fingers 2-1-…-3, i.e. frets 3-2-0-0-0-3). The importer therefore fills
> `chord_voicings.fingers` and leaves `frets` empty; only the hand-authored concept shapes (and the library voicings
> they match) get real frets. See `docs/agent-log/DECISIONS.md`.
>
> Real frets for most chords come from [tombatossals/chords-db](https://github.com/tombatossals/chords-db) (MIT, see
> `THIRD-PARTY-NOTICES.md`): `seed/chord-voicings.json` is generated by `node scripts/build-chord-voicings.mjs` (run in `web/`)
> from the vendored, hash-pinned data file. Each voicing records where its frets came from in `chord_voicings.frets_source`
> (`authored` or `chords-db`).

## Troubleshooting

- **`dotnet new`/sln problems:** the `.sln` is hand-written. If your SDK rejects it, recreate it:
  `dotnet new sln -n GuitarApp` then `dotnet sln add (Get-ChildItem -Recurse -Filter *.csproj)` (PowerShell) and tell me.
- **Package version errors (`NU1102`, etc.):** package versions float inside the 10.x line on purpose (e.g. `10.*`);
  paste the message and the pins get adjusted.
- **Port 5432 already in use:** set `POSTGRES_PORT=5433` in `.env` and use `Port=5433` in the connection string.
- **Reset local data:** `docker compose down -v`.

## Conventions

- Tables/columns are `snake_case` (EFCore.NamingConventions); ids are client-generated UUIDv7; timestamps are `timestamptz` (UTC),
  stamped by `TimestampInterceptor`.
- Localised text (`LocalizedText`) is stored as `jsonb` `{ "en": …, "vi": …, "ja": …, "zh": …, "es": … }`; English is required.
- Guitar strings use the web app's numbering end-to-end: **1 = low E … 6 = high e**; `Frets[0]` is the low E string;
  `-1` = muted, `0` = open.
- Domain rule violations throw `DomainException` → HTTP 400 `application/problem+json`.
- Never commit real secrets. `.env` and `appsettings.Development.json` are git-ignored.
