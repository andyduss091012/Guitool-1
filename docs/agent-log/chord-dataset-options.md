# Chord dataset options (real fret data)

Why: the current library (`chord-fingers.csv`) only has **finger numbers** — see DECISIONS.md. We need `frets` per string
(and ideally fingers, base fret, barres) for each chord voicing.

## Checked: `tombatossals/chords-db` (npm `@tombatossals/chords-db`) — checked via WebFetch on 2026-10-06
| Item | Result |
|---|---|
| Licence | **MIT**, "Copyright (c) 2016 David Rubert" (LICENSE file read directly) |
| Format | per key/suffix records: `key`, `suffix`, `positions[]` each with `frets`, `fingers`, `barres`, `capo`, `baseFret`; example C major position 1: frets `x32010`, fingers `032010` |
| Runtime dependencies | none |
| Install-time scripts | none (`preinstall/install/postinstall/prepare` absent); `prepublish` only builds, for maintainers |
| Dev dependencies | babel, jest, husky, lint-staged, prettier (never installed by us) |
| Advisories | none shown on the repo page; **not independently verified** (no CVE database access here) |
| Activity | ~218 commits, 583 stars, 134 forks, 15 open issues |
| Coverage | not stated on the page; says many chords/instruments are still missing. Expect 12 keys (flats/sharps one spelling each) and fewer chord qualities than our 42. |

### Security conclusion
Low risk **if we use only the data**: the package has no runtime code we execute, no install scripts, MIT is permissive.
Rules for using it:
1. Do **not** add it as an npm dependency of `web/` or run its build. Download the tarball once and keep only the JSON + LICENSE under `backend/tools/GuitarApp.Importer/third-party/chords-db/`.
2. Pin the version, record `dist.integrity` / sha256 of the file we import in `THIRD-PARTY-NOTICES.md`.
3. Keep the MIT licence text and copyright notice; mention the source in the app credits.
4. Validate every record through the Domain rules (6 strings, frets -1..24, fingers -1..4); reject, don't repair.
5. Review the diff whenever the data is updated.

### Gaps vs our current library (to decide when the data is in)
- Our 18 root spellings (A#/Bb, Cb, D#/Eb …) → chords-db uses one spelling per pitch; we would map enharmonic twins to the same voicings.
- Our 42 quality codes → chords-db suffix names differ (`major`, `minor`, `m7`, `maj7`, …); a mapping table is needed and chords without data stay hidden.

## Not verified (WebSearch disabled for this account — from memory only, check before use)
- Other open JSON chord sets on GitHub/Kaggle (licences vary; many scrape commercial sites — avoid those).
- ChordPro project chord definitions (check licence).
- Hosted chord APIs (e.g. Uberchord): not a dataset we could ship offline; terms must be read.

## Outcome (2026-10-06)
Adopted — data only, pinned and validated. See the last two entries in `DECISIONS.md` and `THIRD-PARTY-NOTICES.md`.
Regenerate with `node scripts/build-chord-voicings.mjs` (from `web/`). Chords the CSV knows but chords-db does not
(44 pairs: the 5/power chord, m13, 13(#9)/13(b9)/13(#11), 7(#11), 7(b13), 6(#11), +(#11)) stay hidden in the web app and
are stored finger-only in the backend.
