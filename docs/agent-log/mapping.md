# Phase 0.6 — Mapping to target entities, gaps, open questions

## OPEN QUESTIONS FOR HUMAN REVIEW (blocking ones first)

**Blocking before Phase 1**
- **Q1. No JSON exists.** All content is typed TS modules. Proposed: a one-off export script in `web/scripts/` that dumps the TS modules to `backend/tools/GuitarApp.Importer/seed/*.json`; TS stays the source of truth until Phase 6. OK?
- **Q2. No way to build/test .NET in this environment.** No `dotnet` SDK on the device VM or cloud workspace; `api.nuget.org` and `dot.net` return 403 (org egress policy); npm registry is also blocked. The plan requires `dotnet build/test` before any task is "done". Options: (a) you allow `api.nuget.org` + `dot.net`/`builds.dotnet.microsoft.com` (+ Docker for Testcontainers) for this account so I can build and test here; (b) I write the code and you run `dotnet build && dotnet test` on your Windows machine and paste failures back (slower, unverified code between rounds); (c) other. **Which?**
- **Q3. i18n content is out of sync.** The device repo still has plain-English content (verified: 0 localized exercise/song/concept fields). A finished-but-unpushed pass in the cloud workspace converts built-in content to `{en,vi,ja,zh,es}` objects (27 exercises, 10 concepts, 20 song practiceNotes) and ~9 consumer components still need `l()` wiring. The plan has **no localization model**. Decide: (a) finish/sync i18n *first*, then import localized content as jsonb `{lang: text}` columns (simple) or `*_translation` tables (queryable); (b) migrate English only and keep translations frontend-side; (c) defer. Recommended: (a) with jsonb for the pilot.
- **Q4. Tab rights.** 3 of the 4 files in `shared-tabs/` are third-party commercial tabs (Guns N' Roses, Metallica ×2); the 4th has no artist/rights info. The plan's `Tab.IsOfficial` can't express rights, and Phase 2 would upload them to blob and (Phase 4) let every signed-in user download. Proposed: add `source`, `source_url`, `external_id`, `license`, `can_cache`, `can_redistribute` (as in the existing admin-import metadata) to `Tab`/`TabVersion`; importer sets `rights_status = unverified` and the `ITabAccessPolicy` denies View/Download for non-admins until an admin sets it. Local Azurite only until you confirm. OK?

**Needed before the phase they affect**
- **Q5. Unmatched tabs (Phase 2).** Only *Master of Puppets* (`song-master-of-puppets`) has a Song row. *Sweet Child O' Mine*, *Enter Sandman* and the Vietnamese file (no artist) don't. Create new Song/Artist rows for them, or leave in the "unmatched" report?
- **Q6. Artists (Phase 1).** `Song.artist` is free text → derive `Artist` rows (18 distinct). One value is a credit line ("Johann Pachelbel (trad., arr. for solo guitar)"). Normalize to "Johann Pachelbel" + put the arrangement note in Song description? Titles also carry qualifiers ("(main riff)", "(intro)") — keep in title?
- **Q7. Plan entities with no source data.** `Album`, `Year`, `Bpm`, `DurationSeconds`, `Key` (4/20 only), `Tuning` table (all 20 songs = "Standard (EADGBE)"; custom songs are free text), **Gear** (`Amp`, `Effect`, `Preset`, `PresetBlock` — the Amp Tones page is a placeholder, no data), **Courses/Lessons** (none; exercises are standalone), `Technique` (type exists, 0 records). Proposed: create the tables + endpoints (cheap) but ship them empty; seed only `Tuning` ("Standard (EADGBE)"). No fabricated content.
- **Q8. Chord model.** (a) Source has 18 root spellings incl. enharmonic twins (A#/Bb, C#/Db…): keep spelled roots as separate `Chord` rows (496 chords, matches today's UI) or normalize to 12 pitch classes? Proposed: keep spelling, unique `(root, quality)` as the plan says. (b) 42 quality codes (`maj`, `m7`, `7(#9)`…) → store the code as text `quality` (+ display label), not an enum. (c) No finger data for the 2,554 CSV voicings → `Fingers` nullable. (d) The 8 hand-authored chord concepts overlap library chords (e.g. E major) and **do** have fingers/CAGED labels → import as `IsPreferred` voicings (with fingers) and merge by `(root, quality)`. (e) Current chord/shape ids (`A-t0`, `csv-A-t0-0`) are positional and unstable → natural key `(root, quality, voicing index)`.
- **Q9. String-number convention.** App: string **1 = low E … 6 = high e**. Plan: `Frets[0]` = low E ("string 6"). API should use *one* documented convention. Proposed: keep array order low E→high e for voicings, and for `ScalePositionNote.String` use the **standard guitar numbering (1 = high e … 6 = low E)** with the importer converting (`6 - appString + 1`) — **or** keep the app's numbering to avoid touching the renderer. Which?
- **Q10. Exercise columns.** Plan's `Exercise(Name, Type, Skill, Difficulty, EstimatedMinutes, Importance, PatternJson)` vs app (`category`, `usefulness`, `recommended/min/maxDuration`, `skillTags[]`, `instructions[]`, `tips[]`, `commonMistakes[]`, `recommendedBpm`, `conceptIds[]`, legacy `diagram`). Proposed: map `category→Type`, first/primary tag→`Skill`, store the rest as additional columns/`text[]`/jsonb (never drop). `conceptIds`→join table to concepts; `diagram` (3 exercises)→`PatternJson`.
- **Q11. Progress model (Phase 4).** Plan's `UserExerciseProgress(Level, Accuracy)` — the app **never records accuracy or level**. It records `timesPracticed, totalSeconds, timesSkipped, lastPracticedDate, bestBpm, perceivedDifficulty, isFavorite`, plus streak, session history (planned/elapsed/extra seconds, bpm) and per-song status. Also **not in the plan's tables:** `UserSettings` (level, daily minutes, focus categories, reminders), `todaySession`, **user-created exercises and songs** (custom items would be lost on guest→account upgrade). Proposed: extend §5 with `UserSettings`, `UserExercise`, `UserSong`, `UserSongProgress`, and add the app's real progress columns; treat `Accuracy`/`Level` as nullable/unused.
- **Q12. Practice-plan algorithm (4.6).** The app already has a deterministic scorer (`sessionGenerator.ts`: importance/usefulness, recency, weak area, variety, focus categories, level-fit, seeded jitter). The plan specifies a different formula based on accuracy + prerequisites (no data for either). Proposed: port the *existing* algorithm to C# as `PracticePlanService` (same behaviour, pure function), add prerequisite boost only when `ExercisePrerequisite` data exists. OK?
- **Q13. "My Tabs" (user's own imported files, IndexedDB).** Phase 4 says guests get no offline tab copies and no export. User-uploaded files are the user's own — propose exempting them (stay local-only, never uploaded) while shared/blob tabs follow the guest rules.
- **Q14. Existing Express `tabs-server`** (built in the previous task) overlaps Phase 2. Keep running until Phase 6 (plan guardrail), then retire. OK?
- **Q15. Demo lyrics** (`demoSongs.ts`, 3 original songs) have no plan entity. Propose leaving them client-side (out of scope) unless you want a `SongLyrics` table.
- **Q16. .NET version / hosting.** "Current LTS" — I'll target .NET 10 (LTS) unless you say otherwise. Local dev: Docker Postgres + Azurite (needs Docker Desktop on your machine).

## Mapping (source → target)

| Source | Records | Target (plan §5) | Status / gaps |
|---|---|---|---|
| `SONGS[].artist` (string) | 18 distinct | `Artist` (Name, Slug) | derive; slug from name; ImageKey null; Q6 |
| `SONGS[]` | 20 | `Song` | map id→`slug`; title, genre, difficulty, tags→`SongTag`/`text[]`, capo, keySignature→`Key`, practiceNotes→`Description`; **no** Year/Bpm/Duration/Album/Thumbnail (Q7). `Genre` is an app enum (9 values) → store as string |
| `SONGS[].tuning` | 1 distinct value | `Tuning` | seed 1 row "Standard (EADGBE)" (Notes `E A D G B E`); custom free-text tunings stay text for user songs |
| `shared-tabs/*` (4) | 4 | `Tab` + `TabVersion` v1 + Blob | Q4/Q5; format from magic bytes (gp3/gp4/gp7-zip), `ChecksumSha256` computed, size known |
| `EXERCISES[]` | 27 | `Exercise` | Q10; `id` string→`slug` (must stay stable: persisted in user sessions); `skillTags`→`text[]`; 0 duplicate ids |
| `EXERCISES[].conceptIds` | 3 exercises | join `ExerciseConcept` | refs resolve? **verify in Phase 1 importer** (reject if dangling) |
| `EXERCISES[].diagram` | 3 | `Exercise.PatternJson` | legacy shape → normalise to plan's `{type,name,root,position,notes[]}` in Phase 3 |
| `CHORD_CONCEPTS` (8) + shapes | 8 / 9 shapes | `Chord` + `ChordVoicing` (IsPreferred, fingers) | Q8d; names like "E Major" → Root `E`, Quality `maj` |
| `CHORD_FINGERS_RAW` | 2,554 | `Chord` (496) + `ChordVoicing` (2,554) | Q8; `frets` string → `int[6]` (`x`→-1); BaseFret from min fretted; Fingers null; derive `Difficulty` (none in source → null/heuristic?) |
| `SCALE_CONCEPTS` (2) + shapes | 2 / 10 shapes | `Scale` + `ScalePosition` + `ScalePositionNote` | IntervalPattern from `FretPosition.interval`; `Degree`; Q9 string numbering; labels "Shape 1–5" → `Position` |
| `Technique`/arpeggio concepts | 0 | `Technique` | empty |
| Amps / Effects / Presets | — | `Amp`,`Effect`,`Preset`,`PresetBlock` | no source (Q7) |
| Courses / Lessons | — | `Course`,`Lesson`,`LessonExercise` | no source (Q7) — Phase 3 imports exercises only |
| `DEMO_SONGS` | 3 | — | out of plan (Q15) |
| localStorage `guitool:v1` | per user | Phase 4 tables | Q11 |
| IndexedDB `guitool-tabs` | per user | stays local | Q13 |

## Data-quality findings
- **No duplicate ids** in exercises (27/27 unique) or songs (20/20 unique).
- Chord CSV: 0 malformed fret strings (all 6 fields); enharmonic spellings kept as separate roots (A# vs Bb, etc.); exact-duplicate voicings were already dropped upstream; voicing order = by fret position.
- Chord CSV `NOTE_NAMES`/`CHORD_STRUCTURE` columns were intentionally not used (disagreed with fretted notes on most rows) — roles are derived. Don't re-import those columns.
- All 20 songs report standard tuning; several well-known songs in reality use other tunings/capos → data is "unambiguous-only", many nulls by design (capo 1/20, key 4/20).
- `Exercise.category` includes `song` but exercises don't reference `Song` rows (no FK possible today).
- Genre enum contains `Pop` and `Other` with 0 rows; one genre value contains a slash (`Classical / Fingerstyle`) — fine as string, careful in URL/filter handling.
- Tab files: one is a zip-based `.gp` (GP7+) with a non-ASCII (Vietnamese) name → blob keys must be ID-based, never the original filename (plan §7.2 already does this).
- `web/dist/` is stale and git-ignored — ignore for inventory.
