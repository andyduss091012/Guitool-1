# Phase 0.1–0.3 — Inventory (2026-10-06)

Repo root: `D:\Personal\Guitool` (git, branch main). Only `web/` exists (the earlier iOS history was removed in commit `cb95590`). `backend/` and `docs/` do not exist yet.

> **Headline discrepancy:** there are **zero JSON data files**. All content is typed TypeScript modules under `web/src/data/`. See `mapping.md` → "Open questions".

## Static content (compiled into the bundle)

| File | Size | Lines | Records | Shape |
|---|---|---|---|---|
| `src/data/exercises.ts` | 33.8 KB | 749 | **27** exercises | `Exercise[]` (`EXERCISES`) |
| `src/data/songs.ts` | 9.8 KB | 244 | **20** songs | `Song[]` (`SONGS`) |
| `src/data/concepts/chords.ts` | 10.2 KB | 302 | **8** chord concepts | `ChordConcept[]` |
| `src/data/concepts/scales.ts` | 13.7 KB | 260 | **2** scale concepts | `ScaleConcept[]` |
| `src/data/concepts/index.ts` | 0.8 KB | 22 | — | aggregates 10 concepts (26 `FretShape`s total) |
| `src/data/chordFingersRaw.ts` | 81.1 KB | 2576 | **2,554** `[root,type,frets]` tuples | generated from user's `chord-fingers.csv` |
| `src/data/chordLibrary.ts` | 9.6 KB | 295 | derived at runtime: **496** chords / **2,554** shapes / 18 root groups | code, not data |
| `src/data/demoSongs.ts` | 4.1 KB | 121 | **3** original demo songs (ChordPro-lite lines, 53 lines total) | `DemoSong[]` |

Not present anywhere in the repo: courses, lessons, artists, albums, amps, effects, presets, tunings table, techniques, users.

## Browser-persisted user data (not repo data, but must be migrated in Phase 4)

| Store | Key / DB | Contents |
|---|---|---|
| localStorage | `guitool:v1` (schema v1) | `progress` (streak, totals, `exerciseStats{}`, `sessionHistory[≤120]`), `settings`, `todaySession`, `customExercises[]`, `customSongs[]`, `songProgress{}` |
| localStorage | locale key, theme key (`useLocale.tsx`, `useTheme.tsx`) | UI language (en/vi/ja/zh/es), light/dark |
| IndexedDB | DB `guitool-tabs`, store `tabFiles` | user-imported tab files: metadata + raw bytes (`StoredTabFile` + `data: ArrayBuffer`) |

## Tab / asset files

`web/shared-tabs/` (git-ignored; 4 files + README, **332,520 bytes total ≈ 325 KB**):

| File | Ext | Bytes | Magic | SHA-256 (first 16) | Naming pattern |
|---|---|---|---|---|---|
| `Guns N Roses - Sweet Child O Mine.gp3` | gp3 | 54,797 | `FICHIER GUITAR PRO v3.00` | 3397b0545c15d5ee | `Artist - Title` |
| `Metallica - Enter Sandman.gp3` | gp3 | 41,379 | `FICHIER GUITAR PRO v3.00` | f648015058f7fcfb | `Artist - Title` |
| `Metallica - Master Of Puppets.gp4` | gp4 | 114,867 | `FICHIER GUITAR PRO v4.00` | 6fe450d3bea735ac | `Artist - Title` |
| `Nhất Bái Thiên Địa.gp` | gp | 121,477 | `PK` (zip, GP7+) | 290564133cec6e0a | title only, no artist, non-ASCII |

Song matching against `SONGS`: only **Metallica – Master of Puppets** has a (probable) counterpart (`song-master-of-puppets`, title "Master of Puppets (main riff)" — differs from the file name). The other three have **no** song row. 

Other binary assets (these are **frontend runtime assets for alphaTab, not tab content** — they stay in `web/public/`):
- `public/font/Bravura.*` (eot/otf/svg/woff/woff2 + OFL docs) ≈ 3.7 MB — music-notation font.
- `public/soundfont/sonivox.sf2` (1.35 MB) / `.sf3` (0.98 MB) — playback soundfont.
- `public/pick.svg`.
- `web/dist/` is a stale build output (git-ignored).

## Backend that already exists (out of the plan's scope, overlaps Phase 2)

`web/docker/tabs-server/` — Express file server (`/api/tabs`, `/api/tabs/:id`, `/api/tabs/:id/file`, `POST /admin/tabs/import`), `LocalTabStorage` abstraction, per-tab `metadata.json` (title, artist, format, source, externalId, contentHash, importedAt, license, canCache, canRedistribute). Tests: `test/importer.test.js` (9 pass, dependency-free); `test/server.test.js` needs `npm install`.

## Tooling available to this agent (affects verification)

| Tool | Device VM | Cloud workspace |
|---|---|---|
| .NET SDK | **no** | **no** |
| NuGet / dot.net | — | **blocked (403, org egress policy)** |
| npm registry | blocked | blocked |
| Docker | no | CLI present, no daemon verified |
| psql | — | present |
| Node 22 | yes | yes |
| `web/node_modules` | present (Windows install, win32 native bindings — Linux VM can't run rolldown/vite; `tsc` works) | none |
