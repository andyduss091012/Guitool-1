# Phase 0.4–0.5 — Frontend data usage & client-side logic

Stack: React 19 + Vite + TS + Tailwind, `react-router-dom` v6. Routes (`App.tsx`): `/`, `/practice`, `/progress`, `/tuner`, `/metronome`, `/songs`→`/songs/tabs`, `/songs/tabs`, `/songs/chords`, `/my-tabs`→`/songs/tabs`, `/amp-tones`, `/library`, `/level`. **No router/visual changes are planned (guardrail: ask a human first).**

## Today's data flow
```
src/data/*.ts  ──(import)──►  services/exerciseLibrary.ts, services/songLibrary.ts (+ data/concepts, data/chordLibrary, data/demoSongs directly)
                                 │  merged with user-added custom items from localStorage
                                 ▼
hooks/useGuitool.tsx  (GuitoolProvider: single in-memory state ⇄ localStorage 'guitool:v1', saved on every change)
                                 ▼
pages/* → features/* → components/*   (everything else receives arrays via props/context)
```
Only **two network calls** exist: `services/tabShareApi.ts` → `GET {VITE_TABS_SERVER_URL}/api/tabs` and `/api/tabs/:name`.
Env flag: Vite uses `VITE_*` (not `REACT_APP_*`); the plan's `DATA_SOURCE` flag → `VITE_DATA_SOURCE=local|api`.

## Component → data dependency
| Component / module | Data source today | Notes |
|---|---|---|
| `hooks/useGuitool.tsx` | `buildLibrary()` (EXERCISES + custom), `buildSongLibrary()` (SONGS + custom), localStorage state | The seam. Exposes `exercises`, `songs`, `getExercise`, `getSong`, `getSongProgress`, add/edit/remove custom, progress, session |
| `services/exerciseLibrary.ts` | `data/exercises` | Only importer of `EXERCISES` (by design) |
| `services/songLibrary.ts` | `data/songs` | Only importer of `SONGS` |
| `services/sessionGenerator.ts` | takes `library`, `progress`, `settings` (pure) | Client-side "Today's Practice" scoring — Phase 4.6 port candidate |
| `services/progressService.ts`, `progressStats.ts` | `UserProgress` (pure) | Streak / stats / favorites |
| `components/practice/MiniMusicTab.tsx` | `data/concepts` `getConcept(id)` | Resolves `Exercise.conceptIds` |
| `features/chords/ChordLibraryGrid.tsx` | `data/chordLibrary` `CHORD_LIBRARY_BY_ROOT` (2,554 shapes built at import time) | Whole chord dataset is bundled and held in memory |
| `features/chords/SongLyricsView.tsx` | `data/demoSongs`, `findLibraryChordByName` | Demo lyrics + chord popovers |
| `pages/Songs*.tsx`, `features/songs/*` | `songs` from context | `SongLibraryList`, `SongDetailView`, `AddSongForm` |
| `pages/Library.tsx`, `features/library/*` | `exercises` from context | `ExerciseLibraryList`, `ExerciseDetailView`, `AddExerciseForm` |
| `pages/Dashboard`, `Practice`, `Progress`, `features/practice/*`, `features/progress/*` | context (`state.todaySession`, `progress`, `getExercise`) | |
| `pages/SongsTabs.tsx` (+ legacy `pages/MyTabs.tsx`, unused route) | IndexedDB via `useTabFiles` / `services/tabFileStore.ts`; shared list via `tabShareApi` | `TabPlayer.tsx` loads bytes into alphaTab (`api.load`) |
| `features/mytabs/SharedTabLibrary.tsx` | `tabShareApi` (Docker server) | One-way "pull" into IndexedDB |
| `hooks/useLocale.tsx` | `i18n/translations.ts` (UI strings, 5 languages) | + `l()` for `LocalizableText` content (cloud copy only — see mapping Q6) |
| `public/font`, `public/soundfont` | static files | alphaTab runtime; stay in frontend |

## Client-side filtering / searching / sorting that must move server-side (flag = api)
| Where | Logic | Target API param |
|---|---|---|
| `features/songs/SongLibraryList.tsx` L22–36 | `genre`, `status` (**per-user** progress), free-text `query` over title/artist/tags (substring, case-insensitive) | `genre`, `search`; `status` stays client/user-data (guest) or `me/…` (account) |
| `features/library/ExerciseLibraryList.tsx` L29–36 | `category` + `query` over name/skillTags | `category`, `search` |
| `features/chords/ChordLibraryGrid.tsx` | group by root, list chord types → shapes | `GET /api/chords?root=` → `/api/chords/{id}/voicings` (replaces bundling 2,554 shapes) |
| `pages/Dashboard.tsx` L34 | top-3 by `importance` from today's session | server-side only if plan endpoint returns it; else keep client-side |
| `services/sessionGenerator.ts` | scoring + selection | Phase 4.6/4.7 (`PracticePlanService`) |
| `services/progressService.ts` / `progressStats.ts` | streak, weekly minutes, weak areas, favorites | stay client-side for guests; server aggregates for accounts |
| `features/mytabs/*` | list sorted by `addedAt` desc | `GET /api/songs/{id}/tabs` (shared) vs IndexedDB (user's own files) |
| Library pages | **no pagination anywhere** (all arrays rendered) | all list endpoints paginated `{items,total,page,pageSize}` |

## Things that make the swap non-trivial
1. **Synchronous access.** `getExercise(id)`/`getSong(id)` are sync lookups used by the session generator, stats, dashboard, etc. API data is async. The data-access layer needs a cache/prefetch (e.g. load exercises once — 27 rows — and expose them through context) rather than per-call fetches.
2. **Custom (user-authored) items** are merged into the same arrays as built-ins (`isCustom`). With an API, built-ins come from the server and custom items remain user data (local for guests, `me/…` for accounts) — the merge stays client-side.
3. **Exercise ids are strings used inside persisted sessions/stats**; the API must keep returning the same string ids (slug) or progress/session history breaks. The plan's Guid PK + slug works only if `slug` == today's `id` and the API accepts the slug wherever an id is expected.
4. **Chord/shape ids** (`A-t0`, `csv-A-t0-0`) are positional and unstable.
