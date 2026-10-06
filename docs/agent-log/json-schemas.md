# Phase 0.2 — Inferred schemas (from TypeScript types + runtime stats)

Because there is no JSON, schemas come from `src/types/*.ts` and from a throwaway script that loaded every dataset and counted values (script lived in `$HOME/scratch`, outside the repo; nothing in the repo was modified).

## Exercise (27 records) — `types/exercise.ts`
| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✔ | slug like `technique-alternate-picking`; unique (0 dupes); custom ones get `custom-…` |
| `name`, `description` | string | ✔ | plain English on device (see i18n discrepancy) |
| `category` | enum `technique|scales|rhythm|chords|fretboard|improvisation|song` | ✔ | counts 6/4/4/4/3/3/3 |
| `difficulty`, `importance`, `usefulness` | 1–5 | ✔ | difficulty histogram 1:1 2:8 3:14 4:3 5:1 |
| `recommendedDuration`, `minDuration`, `maxDuration` | minutes (int) | ✔ | |
| `skillTags` | string[] | ✔ | 58 distinct tags |
| `instructions` | string[] | ✔ | ordered |
| `tips`, `commonMistakes` | string[] | opt | |
| `recommendedBpm` | `{min,max}` | opt | 19/27 |
| `diagram` | `FretboardDiagram` | opt | legacy, 3/27 |
| `conceptIds` | string[] → `MusicConcept.id` | opt | 3/27 (cross-reference) |
| `isCustom` | bool | opt | never set on built-ins |

`FretboardDiagram`: `{ mode: 'scale'|'chord', startFret, fretCount, notes: {string 1–6, fret, finger?, root?}[], mutedStrings?, caption? }`.

## Song (20 records) — `types/song.ts`
`id` (`song-…` slug, unique) · `title` · `artist` (free text; 18 distinct, 2 artists have >1 song) · `genre` enum (7 used: Rock 6, Folk 4, Metal 3, Classical / Fingerstyle 3, Blues 2, Reggae 1, Country 1; enum also has Pop, Other) · `difficulty` 1–5 · `tuning` (free text; **all 20 = "Standard (EADGBE)"**) · `capo?` (1/20) · `keySignature?` (4/20) · `practiceNotes` (original prose) · `tags[]` (43 distinct) · `isCustom?`.
Several titles carry arrangement qualifiers in the title string, e.g. "(main riff)", "(intro)", "(fingerstyle arrangement)". One artist string is a credit line ("Johann Pachelbel (trad., arr. for solo guitar)").
**Absent vs plan:** Year, Bpm, DurationSeconds, Album, Artist entity, Tuning entity, Description, ThumbnailKey.

## MusicConcept (10 records, 26 shapes) — `types/musicConcept.ts`
`ChordConcept {id,type:'chord',name,aliases?,description,category,shapes[]}` (8; ids like `chord-open-e-major`, `chord-caged-major-g`) and `ScaleConcept {…, family, shapes[]}` (2: `scale-minor-pentatonic`, `scale-major-pentatonic`). `ArpeggioConcept`/`TechniqueConcept` types exist but have **0** records.
`FretShape {id,label,startFret,fretCount,positions[],mutedStrings?,caption?}`; `FretPosition {string 1–6,fret,role?,finger?,interval?}`. 13 distinct shape labels (Open, Barre, Alternative, A/C/D/E/G-shape, Shape 1–5).
**String numbering:** the app numbers strings **1 = low E … 6 = high e** (reverse of the usual guitar convention where string 1 = high e). The plan's `ChordVoicing.Frets[0]` = low E, which matches the app's *order* but not its *numbers*. `ScalePositionNote.String` needs an explicit convention before any import (see mapping.md Q9).

## Chord library — `chordFingersRaw.ts` → `chordLibrary.ts`
Raw tuple `[root, type, frets]`; `frets` = `"x,0,1,1,1,x"` (6 comma-separated, `x` = muted, `0` = open), order **string 1 (low E) → string 6 (high e)**. 2,554 tuples, 0 malformed lengths, 18 root spellings (A, A#, Ab, B, Bb, C, C#, Cb, D, D#, Db, E, Eb, F, F#, G, G#, Gb — **enharmonic twins kept as separate roots**), 42 type codes (maj, m, 5, 6, m6, 6/9, maj7, m7, maj9, …, `7(#9)`, `m(maj7)`, `+(#11)`), 496 distinct (root,type). Runtime derivation adds: `name`, `typeLabel`, `description`, per-note `role` (root/third/fifth/note), `startFret`, `fretCount`. Shape ids `csv-<chordId>-<n>`; chord ids `A-t0`… (positional — **not stable if the CSV order changes**).
**No finger numbers in the source** (the plan's `ChordVoicing.Fingers int[6]` has no data; the app's `finger` is only on hand-authored concepts).

## DemoSong (3) — `data/demoSongs.ts`
`{id,title,artist,key,lines[]}`; `lines` use `[Chord]` ChordPro-lite markers; empty string = section break. Original text written for the app (not third-party). No plan entity.

## User state — `storage/localStorage.ts`, `types/progress.ts`, `types/session.ts`
- `ExerciseStat {exerciseId,timesPracticed,totalSeconds,timesSkipped,lastPracticedDate?,bestBpm?,perceivedDifficulty?,isFavorite}`
- `UserProgress {streak{current,longest,lastSessionDate?},totalSessionsCompleted,totalPracticeSeconds,exerciseStats{},sessionHistory[]}`
- `PracticeSession {id,date(YYYY-MM-DD),generatedAt,totalPlannedMinutes,exercises[SessionExercise],status,currentExerciseIndex,startedAt?,completedAt?}`; `SessionExercise {exerciseId,plannedSeconds,elapsedSeconds,completed,skipped,extraSecondsAdded,bpmAchieved?}`
- `UserSettings {dailyMinutesTarget,exercisesPerSession{min,max},focusCategories[],reminder{enabled,time,days[]},level}`
- `SongProgressEntry {status want-to-learn|learning|learned, isFavorite}` keyed by song id.
- IndexedDB `StoredTabFile {id(uuid),title,artist,fileName,sizeBytes,addedAt}` + bytes.
