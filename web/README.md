# Guitool 🎸

A lightweight guitar practice companion: it plans a structured ~60-minute
session for you every day, walks you through it with a timer, and tracks
your progress — all in the browser, with no backend and no account.

## Getting started

Requires **Node 20.19+ or 22.12+** (Vite 8's minimum — see the My Tabs note
below if you're on an older Node and `npm install` complains about it).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview   # serve the built app locally to double-check it
```

### Running with Docker

No local Node install needed if you'd rather run it in a container —
`docker-compose.yml` defines two independent services:

```bash
docker compose up dev          # hot-reload dev server, same as `npm run dev` → http://localhost:5173
docker compose up web          # production build served by nginx     → http://localhost:8080
docker compose up tabs-server  # shared Guitar Pro tab file-server           → http://localhost:4001
```

- **`dev`** (`Dockerfile.dev`) bind-mounts this folder into the container
  and runs the real Vite dev server with `--host 0.0.0.0` so it's reachable
  from outside the container — edits you make on your machine hot-reload
  in the browser exactly like running `npm run dev` directly.
  `node_modules` is kept as the container's own (see the comment in
  `docker-compose.yml`) so it isn't clobbered by the bind mount.
- **`web`** (`Dockerfile`) is a two-stage build: compiles the app with
  Node, then serves the static output with nginx (`docker/nginx.conf`) —
  this is the one to use for actually hosting/deploying Guitool somewhere.
  It includes SPA-fallback routing (so a hard refresh on e.g.
  `/library/some-exercise` doesn't 404) and long-cache headers for Vite's
  content-hashed asset filenames.
- **`tabs-server`** (`docker/tabs-server/`) is new in Phase 5 — a tiny
  Express file-server for the Songs → Tabs shared library (see that
  section below). Independent of `dev`/`web`: the frontend just talks to
  it over HTTP from the browser, so you can run either without the other.

Run `docker compose up --build <service>` instead of plain `up` after
changing `package.json` or either `Dockerfile*`, so the image actually
rebuilds rather than reusing a stale cached layer. There's no
`package-lock.json` committed yet (see the note below on `npm ci`); once
you commit one from a real `npm install`, both Dockerfiles will use it
automatically (they `COPY package-lock.json*` — the trailing `*` makes it
optional either way).

⚠️ Not yet verified end-to-end: this sandbox has no Docker daemon and no
npm registry access (same limitation noted throughout this README for
`npm install` generally), so these Dockerfiles were written carefully and
reviewed by hand but never actually built/run. If `docker compose up`
turns up an issue, it's most likely something small — a base-image tag
that's moved on, or a path typo — not a structural problem with the
two-stage/bind-mount approach itself.

## What's in the MVP (Phase 1)

- **Dashboard** — streak, today's plan, quick tools, a progress snapshot.
- **Exercise library** (`src/data/exercises.ts`) — 27 original exercises
  across Technique, Scales, Rhythm, Chords, Fretboard, Improvisation and
  Song Practice. Adding a new one is just appending an object to that file.
- **Daily session generator** (`src/services/sessionGenerator.ts`) — a
  deterministic scoring system (importance, usefulness, recency, weak
  areas, category variety, a small seeded random jitter) that picks 2–3
  exercises and splits ~60 minutes between them. "Regenerate" draws a new
  variation for the same day.
- **Practice timer** (`src/features/practice/ActiveExercise.tsx`) —
  countdown per exercise, pause/resume, +5 min, skip, instructions/tips/
  common mistakes, a completion chime, and a session summary at the end.
- **Progress & history** — streak, weekly/monthly totals, a 7-day bar
  chart, most-practiced and needs-attention call-outs, favorites.
- Everything is persisted to `localStorage` (see `src/storage/localStorage.ts`);
  nothing leaves the browser.

## Phase 2 (in progress)

- **Metronome** (`src/features/metronome/`) — live and reachable from the
  nav and the dashboard's Quick Tools. BPM control via slider, +/- steppers,
  tap tempo, *or* typing a number directly into the "Set BPM" field (30–240,
  clamped on blur/Enter). 11 time-signature presets (2/4 through 12/8) and a
  note-value/subdivision selector (quarter, eighth, eighth-note triplet,
  sixteenth) so you can practice subdividing the beat — the beat indicator
  shows both the main beats and the subdivision ticks between them, with the
  main beat clicking louder/higher than the in-between ticks. An
  accent-on-beat-1 toggle (fixed — it previously relied on unset native
  `<button>` padding/border, which could render the knob off-position; it's
  now the standard flex-based switch pattern with `border-0 p-0`, positioned
  by simple flow layout instead of absolute coordinates). The timing engine
  (`useMetronomeEngine.ts`) uses the standard Web Audio "lookahead
  scheduler" pattern rather than a plain `setInterval`, so clicks — main
  beats and subdivisions alike — don't drift the way a naive JS timer would.
- **Library** (`src/features/library/`, `src/pages/Library.tsx`) — add,
  edit, and delete your own exercises. A custom exercise uses the same data
  shape as the built-in ones (name, category, description, difficulty/
  importance/usefulness ratings, duration range, instructions, tips, common
  mistakes, optional BPM range) and is stored in `localStorage` alongside
  the rest of your data. Custom exercises are merged with the built-in 27
  at runtime (`src/services/exerciseLibrary.ts`) and are treated exactly
  like built-in exercises everywhere else in the app — including the daily
  session generator, which can pick them just like any other exercise.
  Built-in exercises are read-only in this view; a "Duplicate & customize"
  button copies one into the add-exercise form as a starting point. A
  "look up online" helper (`src/services/webLookup.ts`) opens pre-built
  Google/YouTube/JustinGuitar search URLs for whatever you're adding —
  it's just URL construction, there's no backend, no scraping, and nothing
  is fetched or embedded from those sites, so anything you learn there
  should be written into the form in your own words rather than copied in.
- **Exercise tags** (`src/services/exerciseTags.ts`) — every exercise,
  built-in or custom, is automatically labeled **Must Learn**, **Easy**,
  **Medium**, or **Hard**. The tag isn't a separate field to keep in sync —
  it's derived straight from the exercise's own importance/difficulty
  ratings (importance 5/5 → Must Learn, otherwise difficulty decides). It
  shows up as a small chip everywhere an exercise appears: the Library list
  and detail view, dashboard/session exercise cards, and the active-practice
  screen; `AddExerciseForm` also shows a live preview of the tag your
  current ratings will produce.
- **Exercise fret diagrams & "read more" links** — the built-in scale and
  chord exercises most people actually want a picture for (the two
  pentatonic patterns, the blues scale, an open chord, and a power chord)
  now show a generated fretboard diagram — which fret, which string, which
  finger, with the root note picked out — in both the Library detail view
  and on the active-practice screen (`src/components/practice/
  FretboardDiagram.tsx`). It's an original SVG rendered from plain note/
  finger data (`diagram` on `Exercise`, `src/types/exercise.ts`), computed
  directly from music theory rather than copied from any book or site — see
  "Notes & known limitations" below for how that data was checked. Every
  exercise (built-in or custom) also gets a "Read more about it" section
  with search links (Google/YouTube/JustinGuitar), the same non-scraping
  pattern the rest of the app uses.
- **Level** (`src/pages/Level.tsx`, its own nav tab) — pick Beginner,
  Intermediate, or Advanced. This feeds the session generator
  (`src/services/sessionGenerator.ts`): each level has a target difficulty,
  and exercises closer to that target score higher, nudging the daily mix
  easier or harder without hard-excluding anything — a **Must Learn**
  exercise can still outscore the level-fit bonus on importance alone.
  Changing your level shows a prompt to regenerate today's session on the
  spot, or it applies automatically starting tomorrow. The dashboard shows
  your current level as a small pill you can tap to change it.

## Phase 3 (in progress)

- **Songs** (`src/features/songs/`, `src/pages/Songs.tsx`) — a real song
  catalog, reachable from the nav and the dashboard's Quick Tools. It's
  deliberately **not** a Songsterr/Ultimate Guitar integration: this
  environment has no network access to reach either site's API, and even
  with access, their tab transcriptions are copyrighted and their terms
  don't allow scraping or reproducing them into another app — the same
  reasoning that kept song data out back in Phase 1. Instead:
  - `src/data/songs.ts` ships 20 original catalog entries (title, artist,
    genre, difficulty, tuning, and — only where well-established — capo/key)
    plus practice notes written in our own words, spanning beginner-friendly
    open-chord songs through advanced tapping/legato/fingerstyle pieces.
  - Every song links out to **Songsterr**, **Ultimate Guitar**, **MuseScore**
    (filtered to free downloads), **911Tabs**, **GProTab**, and **YouTube**
    (`buildSongLookupLinks` in `src/services/webLookup.ts`) — opens in a new
    tab, nothing fetched, embedded, or stored by Guitool. The MuseScore link
    is a real filtered search; 911Tabs and GProTab go to the site itself
    rather than a guessed search URL — their exact search-URL format
    couldn't be confirmed from this environment (see the comment above
    `buildSongLookupLinks` for what was and wasn't verified). A *.gp or
    MusicXML file downloaded from any of these can be brought straight into
    **My Tabs** (below) for real notation and playback. Same non-scraping
    "look up online" pattern already used by the exercise Library, and
    `LookupOnlineLinks` is shared between both features
    (`src/features/library/LookupOnlineLinks.tsx`).
  - You can add your own songs the same way you add custom exercises
    (`src/services/songLibrary.ts`, merged with the built-in catalog at
    runtime), and track **status** (Want to Learn / Learning / Learned) and
    **favorites** per song — built-in or custom — stored in `localStorage`
    (`songProgress` in `src/storage/localStorage.ts`).
- **My Tabs** (`src/features/mytabs/`, `src/pages/MyTabs.tsx`) — a separate
  section from Songs, modeled on
  [louislam/its-mytabs](https://github.com/louislam/its-mytabs): instead of
  a catalog with outbound links, you **import your own** Guitar Pro
  (`.gp`, `.gpx`, `.gp3`–`.gp7`) or MusicXML (`.musicxml`, `.xml`) file —
  from MuseScore, a purchased Guitar Pro download, or something you wrote
  yourself — and Guitool renders the real notation/tab and plays it back,
  in the browser, with no upload and no backend.
  - **Rendering & playback** (`src/features/mytabs/TabPlayer.tsx`) uses
    [alphaTab](https://www.alphatab.net/) (`@coderline/alphatab`, MPL-2.0),
    a client-side notation-rendering and MIDI-playback library, wired in
    via its official Vite plugin (`@coderline/alphatab-vite`, see
    `vite.config.ts`) which copies alphaTab's bundled web font and
    soundfont into the build. You get notation + tab display, a cursor
    that follows playback, and per-track **mute**/**solo** toggles once a
    file loads.
  - **Storage** (`src/services/tabFileStore.ts`) is IndexedDB, not
    `localStorage` — imported files are binary and can be a few MB, past
    what `localStorage`'s string-only, same-origin store is meant to hold.
    Metadata (title, artist, file name, size, added date) and the raw file
    bytes live together in one hand-rolled `guitool-tabs` database, kept
    entirely separate from the `guitool:v1` state the rest of the app uses.
    Nothing here is fetched or scraped — every file comes from something
    you explicitly import — the same non-scraping stance the Songs feature
    (above) and the exercise Library's "look up online" links already take.
  - **Vite 8 required.** `@coderline/alphatab-vite@1.8.4` peer-requires
    `vite@"^7 || ^8"`, and `@vitejs/plugin-react@6.1.1` (the version that
    itself requires `vite@^8`) is the lowest version compatible with that.
    `package.json` pins `"vite": "^8.3.0"` and
    `"@vitejs/plugin-react": "^6.1.1"` for this reason — plugin usage in
    `vite.config.ts` is unchanged (`plugins: [react(), alphaTab()]`), only
    the versions moved. Vite 8 requires **Node 20.19+ or 22.12+**; if
    `npm install` complains about your Node version, that's the fix.
  - ⚠️ **Elevated verification risk, unlike everything else in this repo:**
    this is the one place Guitool calls into a real third-party package.
    This sandbox has never had npm registry access, so — unlike the rest
    of the codebase, which was checked against hand-written ambient stubs
    for internal consistency *and* has now run for real in your browser —
    `TabPlayer.tsx`'s use of the alphaTab API (`AlphaTabApi`, `.load()`,
    `.play()`/`.pause()`/`.stop()`/`.destroy()`, `.changeTrackMute()`/
    `.changeTrackSolo()`, the `.scoreLoaded`/`.error` events) was written
    from the library's well-established public API shape but could not be
    compiled or run against the real package before delivery. Run
    `npm install && npm run dev`, open My Tabs, and try importing a file —
    if anything errors, it's most likely a renamed or reshaped alphaTab
    method, and `TabPlayer.tsx` is the first (and likely only) place to
    look.

## Phase 4 (in progress) — reusable music-concept content system

The exercise system's content model had a real limitation: `Exercise.diagram`
(Phase 2) can only ever hold *one* fret shape, but a scale has five
positions, CAGED gives one chord five shapes, and "Open Chord Changes"
practices five different chords — none of that fit in one diagram. This
phase adds a proper content model for that, without introducing a database
(still typed TS data modules, same approach as exercises/songs — content
mistakes are still caught by the manual TypeScript check, not just found at
runtime).

- **Content model** (`src/types/musicConcept.ts`) — a `MusicConcept` union of
  `ChordConcept | ScaleConcept | ArpeggioConcept | TechniqueConcept`. Each
  one holds an array of `FretShape`s (not just one), and each shape holds
  `FretPosition[]` — string, fret, an optional `role` (`root` / `third` /
  `fifth` / `note`) and an optional suggested `finger`. A concept is
  independent of any one exercise: several exercises can reference the same
  concept, and a concept can carry as many shapes as the real instrument has.
- **Data** (`src/data/concepts/`) — `scales.ts`, `chords.ts`, and an
  `index.ts` aggregator with `getConcept(id)` / `getConcepts(ids)` lookups.
  Populated concepts (arpeggio and technique concepts are fully typed but
  not populated yet):
  - **Minor Pentatonic Scale** and **Major Pentatonic Scale** — each all
    **five** box positions/shapes covering the whole neck (not just "box
    1"), connected end to end, with a scale-degree `interval` label
    (`1`, `b3`, `4`, `5`, `b7` / `1`, `2`, `3`, `5`, `6`) on every note.
  - **CAGED Major Chord Shapes** — the same chord (shown as G) fretted five
    different ways (the C/A/G/E/D shapes), demonstrating "chord shapes/
    voicings" and "barre chords" from the same concept.
  - **C major** and **A minor** — each with three voicings (`Open`,
    `Barre`, `Alternative`), demonstrating multiple voicings of one chord
    outside the full CAGED cycle.
  - Plus five more individual **open chord** concepts (E, A, D, G, Em),
    each a `ChordConcept` with one `open`-category shape.
- **Rendering** — `FretShapeDiagram.tsx` renders one `FretShape` (an SVG,
  generated the same way `FretboardDiagram.tsx` already does, colored by
  `role` — root/3rd/5th get distinct colors instead of just "root vs.
  not"). It takes an optional `labelMode` (`'finger' | 'note' | 'interval'`)
  controlling what small text sits inside each dot — the note name is
  computed on the fly (`utils/fretboardNotes.ts`), the interval either
  comes from the position's own `interval` field (scales) or is derived
  from `role` (chords: root/third/fifth → 1/3/5).
- **Wiring into exercises** — `Exercise` (`types/exercise.ts`) gained
  `conceptIds?: string[]`, alongside the existing `diagram` field (kept for
  exercises not yet migrated). Three exercises were migrated as the pilot:
  - `scales-minor-pentatonic` now references the full 5-shape scale concept
    instead of a single box-1 diagram.
  - `chords-open-chord-changes` now references all five chords its own
    description names (G, C, D, Em, Am) instead of showing only G.
  - `fretboard-caged` — previously had **no diagram at all** — now
    references the CAGED concept's all-five-shapes view.
  The remaining migrated exercises (major pentatonic, blues, power chords)
  and the rest of the library still use the Phase 2 single-diagram field —
  this is a pilot conversion, not a full migration, by design.

### Mini tabs & full-screen shape viewer

The Phase 4 pilot rendered every concept's full shape browser inline and
always expanded, inside `ConceptShapeBrowser.tsx`. This part replaces that
with a compact-preview-plus-full-viewer pattern, closer to how a real tab
app shows a chord/scale reference without taking over the whole page:

- **`MiniMusicTab.tsx`** (`components/practice/`) — the compact card.
  Takes just a `conceptId` prop (no fret data ever passed in — it looks the
  concept up itself via `getConcept`, so there's exactly one place shape
  data lives), shows the concept's name/description, a shape-picker chip
  row when there's more than one shape, and a clickable preview diagram
  labeled "View all shapes →" that opens the full viewer.
- **`ShapeViewer.tsx`** (`components/practice/`) — the full viewer, opened
  by clicking the Mini Tab. Full-screen bottom sheet below the `md`
  breakpoint, centered modal at `md` and up (there's no other modal/dialog
  component in the app to reuse, so this is built from scratch with plain
  React state + native touch events + CSS transitions — no new dependency).
  Supports: Previous/Next and direct shape-chip selection; left/right arrow
  keys and Escape (desktop); left/right swipe via native touch events
  (mobile); a `Fingers` / `Notes` / `Intervals` label-mode toggle; a simple
  focus trap + visible focus rings; `role="dialog"` / `aria-modal` /
  per-control `aria-label`s; and a subtle fade/slide-in transition that
  respects `prefers-reduced-motion` (`motion-safe:`/`motion-reduce:`
  throughout, no animation library).
- **`hooks/useShapeIndex.ts`** — the shared "which shape is active"
  index/next/prev/select logic, used by both `MiniMusicTab` (for its
  preview) and `ShapeViewer` (for the full browser), so the two don't carry
  two separate copies of the same bookkeeping. `MiniMusicTab` passes its
  current index into `ShapeViewer` as `initialIndex` and gets updates back
  via `onIndexChange`, so closing and reopening the viewer resumes where
  you left off — neither component lifts this into shared/global state.
- **`ExerciseDetailView.tsx`** and **`ActiveExercise.tsx`** now render one
  `MiniMusicTab` per `conceptId` instead of `ConceptShapeBrowser`. Because
  `MiniMusicTab`/`ShapeViewer` keep their own local state and are never
  lifted into `ActiveExercise`'s own state, opening/closing the viewer
  during a live practice session does not touch (or reset) the practice
  timer — the timer's `useEffect` only depends on `[paused, totalSeconds]`,
  neither of which this touches.
- **`ConceptShapeBrowser.tsx`** is now unused by both views and left in
  place rather than deleted (see "What's stubbed for later phases" above
  for why — this environment can't delete files from your machine).

## Phase 5 (in progress) — Songs restructuring, shared tabs, chord library, dark mode & language

### Songs is now Tabs + Chords

"Songs" in the nav is now a dropdown with two sub-pages instead of one page:

- **Songs → Tabs** (`src/pages/SongsTabs.tsx`) — the direct successor to the
  old standalone My Tabs page (`src/pages/MyTabs.tsx`, now unused — see
  "What's stubbed for later phases"): real notation rendering and playback
  via alphaTab, for anyone who wants to play solo. Same IndexedDB-backed
  local library as before, plus a new **Shared Library** section (below).
- **Songs → Chords** (`src/pages/SongsChords.tsx`) — new: a **Chord
  Library** and **Song Lyrics** toggle, for anyone who wants to play and
  sing along instead (see below).

`/songs` and the old `/my-tabs` both redirect to `/songs/tabs` so any
existing bookmarks/links keep working. The old song *catalog* (practice
notes + outbound Songsterr/Ultimate Guitar links, Phase 3 above) has been
folded out of the top-level nav for now in favor of these two more directly
useful pages — `src/pages/Songs.tsx` and its supporting
`src/features/songs/` components are unused but left in place (nothing can
be deleted from your machine from here — see "What's stubbed for later
phases").

### Tabs shared library (Docker file-server)

The feature request asked for a way to pull `.gp3`/`.gp4`/`.gp5`/`.gp7`/
`.gpx` files from a shared folder or file share, docker-friendly. Rather
than reaching for object storage (S3/MinIO) or a database for what's
fundamentally "list a folder, download a file," this adds one small,
cheap, purpose-built service:

- **`docker/tabs-server/`** — a ~100-line Node/Express app
  (`server.js`) with one dependency (Express itself). `GET /api/tabs` lists
  recognized tab files in a folder (name, size, last-modified); `GET
  /api/tabs/:name` downloads one. No database, no auth, no writes/deletes —
  the mounted folder on disk *is* the state. Rejects path traversal and
  unrecognized extensions; meant for a trusted home/LAN network behind the
  rest of the compose stack, not the open internet.
- **`docker-compose.yml`**'s new `tabs-server` service bind-mounts
  `./shared-tabs/` (a new, empty-by-default, git-ignored folder — see
  `shared-tabs/README.md`) to `/data/tabs` and publishes port `4001`. Point
  that volume at a different folder or network share instead if your tab
  files live elsewhere.
- **`src/services/tabShareApi.ts`** is the frontend client — `listSharedTabs()`
  / `downloadSharedTab(name)` — used by the new
  **`src/features/mytabs/SharedTabLibrary.tsx`** component on the Songs →
  Tabs page. The server's address comes from the `VITE_TABS_SERVER_URL`
  build-time env var (wired through both `docker-compose.yml` and
  `Dockerfile`, defaulting to `http://localhost:4001`) — every call fails
  soft (an "unavailable" message, not a crash) if the server isn't running,
  since it's an optional add-on: `docker compose up dev` or plain `npm run
  dev` both work fine without it, just without the Shared Library section
  populated.
- Importing a file from the shared library downloads its bytes through
  `tabs-server` and hands them to the exact same `addFile`/IndexedDB path
  manual import already uses (`services/tabFileStore.ts`) — from the app's
  point of view, a shared-library import and a manual file-picker import
  produce an identical local library entry.

Try it with `docker compose up tabs-server`, drop a `.gp`/`.gpx` file into
`shared-tabs/`, and refresh the Songs → Tabs page.

### Admin tab import

The shared library above only ever grows by an operator manually dropping
files into `shared-tabs/`. This adds a second way in — an admin-only HTTP
endpoint and a matching CLI — so a tab can be added to the shared library
**without rebuilding or redeploying anything**, while keeping the Docker
image itself containing only application code.

**What this deliberately is not:** an automated scraper that fetches tabs
from Ultimate Guitar (or any other third-party tab site) by URL or ID.
Guitar Pro tabs are third-party copyrighted arrangements — Ultimate
Guitar's own catalog is itself licensed from music publishers, and its
terms don't permit automated scraping or onward redistribution. So rather
than an importer that reaches out and fetches someone else's content, this
one takes a file an admin already has and already has the rights to store
— their own composition, something they've separately cleared, a file
they're allowed to mirror — and every import records an explicit rights
assertion (see "Storage format" below) rather than assuming redistribution
rights just because a file could be uploaded. This also happens to remove
an entire class of security problem: there's no URL for the server to
fetch on your behalf, so there's no SSRF surface to guard against.

**How a tab gets in:**

- `POST /admin/tabs/import` — `multipart/form-data` with a `file` field
  plus `title`, `source` (a short slug like `own-archive`), and optionally
  `artist`, `sourceUrl`, `externalId`, `license`, `canCache`,
  `canRedistribute`. Requires `Authorization: Bearer <ADMIN_IMPORT_TOKEN>`
  — the endpoint returns `503` if that env var isn't set at all (import is
  *disabled by default*, not just unauthenticated) and `401` if the token
  doesn't match. Rate-limited to 10 imports/minute per server process.

  ```bash
  curl -X POST http://localhost:4001/admin/tabs/import \
    -H "Authorization: Bearer $ADMIN_IMPORT_TOKEN" \
    -F "title=Example Song" \
    -F "artist=Example Artist" \
    -F "source=own-archive" \
    -F "externalId=my-catalog-042" \
    -F "canRedistribute=true" \
    -F "file=@./ExampleSong.gp5"
  ```

  ```json
  {
    "success": true,
    "alreadyExists": false,
    "tab": {
      "id": "3f9a7c21b8e4d016",
      "title": "Example Song",
      "artist": "Example Artist",
      "format": "gp5",
      "fileName": "tab.gp5",
      "source": "own-archive",
      "externalId": "my-catalog-042",
      "contentHash": "…sha256…",
      "importedAt": "2026-09-28T06:00:00.000Z",
      "canCache": false,
      "canRedistribute": true
    }
  }
  ```

  Re-running the exact same import (same `source`+`externalId`, or the
  identical file bytes under a different one) returns
  `"alreadyExists": true` with the existing record — no duplicate file is
  ever written.

- **`npm run import:tab -- --file <path> --title "<title>" --source <slug>`**
  (from `docker/tabs-server/`) — the same pipeline without needing the
  server up or a token in hand; useful when `TABS_DIR` is directly
  reachable (run on the host, or `docker compose exec tabs-server npm run
  import:tab -- ...`). Also accepts `--artist`, `--source-url`,
  `--external-id`, `--license`, `--can-cache`, `--can-redistribute`.

**Storage format** — `docker/tabs-server/lib/tabStorage.js` (a
`TabStorage` interface; `LocalTabStorage` is the only implementation
today, a plain folder on disk) writes each imported tab to its own
subdirectory, format detected from the upload rather than assumed:

```
shared-tabs/
  3f9a7c21b8e4d016/
    tab.gp5
    metadata.json
```

```json
{
  "id": "3f9a7c21b8e4d016",
  "title": "Example Song",
  "artist": "Example Artist",
  "format": "gp5",
  "fileName": "tab.gp5",
  "source": "own-archive",
  "sourceUrl": null,
  "externalId": "my-catalog-042",
  "contentHash": "…sha256…",
  "importedAt": "2026-09-28T06:00:00.000Z",
  "license": null,
  "canCache": false,
  "canRedistribute": true
}
```

`canCache`/`canRedistribute` default to `false` — importing a file never
implies you have the right to redistribute it; an admin has to say so
explicitly. There's no database in this project (see "Notes & known
limitations"), so `metadata.json` next to each file *is* the record —
`GET /api/tabs` lists every one alongside the legacy flat-file list (in a
new, additive `tabs` key existing frontend code doesn't read, so nothing
that already worked breaks), and `GET /api/tabs/:id` /
`GET /api/tabs/:id/file` fetch one tab's metadata and bytes respectively.
The pre-existing `GET /api/tabs` (`files` key) and `GET /api/tabs/:name`
routes are completely unchanged — the same flat-file behavior as before.

**Deduplication** is by `source`+`externalId` first (the primary key —
re-importing the same catalog entry is a no-op) and by SHA-256 content
hash second (catches the same bytes arriving under a different id/URL,
or with no external id at all).

**Security, beyond the admin token:** upload size capped at 25MB
(`MAX_TAB_FILE_BYTES` to change it) via `multer`'s built-in limit; file
format is validated against a fixed extension allow-list plus a cheap
magic-byte sanity check (zip signature for `.gpx`/`.gp7`, no NUL bytes for
`.tex`) rather than trusted from the filename alone; the on-disk id is
always a hash, never the admin-supplied title/externalId/filename, so
there's no path-traversal surface even if one of those contained `../`;
nothing here logs the admin token or file contents.

**Sync across machines/deployments:** exactly as with the read-only
shared library above, `./shared-tabs:/data/tabs` is a bind mount for
*one* Docker host. Running `tabs-server` on a laptop and a production
server, each with their own `./shared-tabs/`, gives you two independent
libraries that never see each other's imports — a tab imported on one
is invisible on the other. If everyone points at the *same* running
`tabs-server` (one server, one shared filesystem), an import is visible
to every user immediately, no rebuild or redeploy involved — that's the
"no Docker rebuild" property the admin-import feature is built around.
Making that true across *multiple* independent hosts means swapping
`LocalTabStorage` for a shared-backend implementation (S3/Azure Blob/a
network filesystem) behind the same `TabStorage` interface — the
interface was written with exactly that swap in mind, but only
`LocalTabStorage` exists today.

**Tests:** `docker/tabs-server/test/` — `importer.test.js` covers the
import pipeline directly (dependency-free, runs with just
`node --test test/importer.test.js`, no `npm install` needed) —
successful import, both dedup paths, invalid source/format, and the two
failure-injection cases (storage failure never writes metadata;
metadata-write failure after a successful save rolls the file back).
`server.test.js` exercises the same things over real HTTP with
`supertest`, plus the unauthenticated-request, path-traversal, oversized-
upload, and "existing flat-file routes still work" cases — this one needs
`npm install` run first (see below). There's no live Ultimate Guitar (or
any external source) to mock, since nothing here calls out to one.

**Known limitations of this pass:**

- No admin UI — this is the API + CLI only. A page to search/list
  candidate tabs and click "Import" (the eventual admin workflow) isn't
  built.
- No PostgreSQL migration — this project has no database at all today, so
  per-tab `metadata.json` plus a folder scan is the whole "index." If a
  real database is added to the project later, swapping the folder-scan
  in `GET /api/tabs`/`findByContentHash` for a real query is a small,
  contained change (same `TabStorage` interface, different backing
  listing).
- The rate limiter is in-memory and per-process — it does not coordinate
  across multiple `tabs-server` instances/replicas.
- `npm test` (the full suite, including the HTTP-level `server.test.js`)
  needs `express`/`multer`/`supertest` installed in
  `docker/tabs-server/`; that install couldn't be run from this session's
  sandboxed environment (its network policy blocks the npm registry, same
  restriction noted elsewhere in this README) — run `npm install && npm
  test` there yourself, or `docker compose build tabs-server` (the image
  build installs `express`/`multer`, the production dependencies, over
  its own network path). The dependency-free `importer.test.js` was run
  directly against this machine's Node and passes (9/9).

### Chord Library

`src/pages/SongsChords.tsx`'s "Chord Library" tab
(`src/features/chords/ChordLibraryGrid.tsx`) is "all kinds of chords on
guitar with many hand positions" — every one of the 12 roots, major and
minor (24 chords total), each with as many playable hand positions as we
have. Rather than hand-authoring dozens of near-duplicate shapes:

- **`src/data/chordLibrary.ts`** reuses the seven hand-authored open chords
  already in `data/concepts/chords.ts` (C/D/E/G/A major, E/A minor) and
  *generates* the rest from four movable barre-chord templates (E-shape
  major/minor, A-shape major/minor — the same shapes the existing CAGED
  content already demonstrates), transposed with the same pitch-class
  arithmetic the README already documents for the CAGED set:
  `(openStringPitchClass + fret) mod 12`. Each template was verified the
  same two-pass way as the CAGED shapes — derived from standard barre
  fingering, then cross-checked by computing every note's actual pitch
  class against the chord tone (root/third/fifth) it claims to be.
- Every chord ends up with 2–3 shapes: its hand-authored open/CAGED
  voicing(s) where one exists, plus a generated E-shape and/or A-shape
  barre voicing (whichever the template's own open position isn't already
  that exact root — e.g. E major only gets a generated A-shape barre, since
  its E-shape *is* the open chord already).
- The grid reuses the existing `ShapeViewer` (built for the Phase 4
  practice-concept model) to page through each chord's hand positions —
  no new viewer component needed, just a small adapter turning a
  `LibraryChord` into the `ChordConcept` shape `ShapeViewer` expects.

### Song Lyrics

The other half of Songs → Chords: pick a song, see its lyrics with chords
laid out above them, for singing along.

- **Dataset** (`src/data/demoSongs.ts`): three short, wholly **original**
  songs — title, artist credit, and every lyric line written from scratch
  for this feature, not sourced from Kaggle or anywhere else. The feature
  request suggested a Kaggle lyrics/chords dataset, but this sandbox has no
  way to authenticate to Kaggle and pull one down, and more importantly a
  real chord-and-lyrics dataset is almost always built from copyrighted
  song lyrics — the same reasoning that's kept the real `Song` catalog
  lyric-free since Phase 1 (see the doc comment on `types/song.ts`). This
  demo dataset is a deliberately separate, clearly-labeled stand-in so the
  feature has something real to render without that risk; swap in a real
  licensed dataset later by replacing this one file — the rendering code
  doesn't care where the data comes from.
- **Format**: "ChordPro-lite" bracket notation (`[G]like this[C]`), parsed
  by a small hand-rolled parser (`src/utils/chordpro.ts`) — not the real
  ChordPro spec (no directives, no precise character-column alignment),
  just enough to say "this chord applies to the text that follows it."
- **Rendering** (`src/features/chords/SongLyricsView.tsx`): a song picker,
  then each line rendered with its chords as small tappable labels above
  the lyric — tapping one opens the same `ShapeViewer` the Chord Library
  uses (via `data/chordLibrary.ts`'s `findLibraryChordByName`, which parses
  shorthand like `"Am"`/`"F#"` into a root + quality).

### Dark mode & language (top-right controls)

- **Theme** (`src/hooks/useTheme.tsx`, `src/components/layout/GlobalControls.tsx`)
  — a light/dark toggle, persisted to `localStorage` and defaulting to the
  system's `prefers-color-scheme` on first visit. Implemented as CSS custom
  properties: every Tailwind color token Guitool uses (`ink`, `brass`,
  `ember`, `parchment`) is defined in `tailwind.config.js` as
  `rgb(var(--color-xxx-500) / <alpha-value>)` instead of a literal hex
  value, with the actual RGB triples defined in `src/index.css` under
  `:root` (dark, the original look) and `:root[data-theme='light']` (new).
  Toggling the theme just flips a `data-theme` attribute on `<html>` — every
  existing component's existing Tailwind classes respond automatically,
  with zero per-component changes needed. (This also fixed a latent bug:
  `parchment-500` was used in seven files but never defined in the old
  config, so it silently rendered no color at all — it's defined for both
  themes now.)
- **Language** (`src/i18n/`, `src/hooks/useLocale.tsx`) — a 5-language
  picker (English/Vietnamese/Japanese/Chinese/Spanish), persisted to
  `localStorage`. Deliberately scoped to the app's global chrome only — nav
  labels, the sidebar title/tagline, the theme/language controls themselves
  — via a typed `TranslationKey` union (`i18n/translations.ts`) so every
  `t(key)` call is checked against a known key at compile time. Exercise
  content, song data, and other feature text (including everything
  described elsewhere in Phase 5, above) stays English-only; translating
  that is real future work, not a small follow-up. The four non-English
  dictionaries are AI-assisted translations, not reviewed by a native
  speaker of each language — a solid starting point, not a finished
  localization pass.
- **Mobile nav gap fix**: while restructuring the nav for the Songs
  dropdown, a pre-existing gap became more pressing — Library, Songs, and
  Amp & Tone had no mobile nav entry point at all (the bottom tab bar only
  ever rendered the primary nav items). `AppShell.tsx` now adds a "More"
  button opening a bottom-sheet (`MobileMoreSheet`) listing those, reusing
  `ShapeViewer`'s modal conventions (mount transition, `Escape` handling,
  backdrop click, `role="dialog"`) rather than introducing a new pattern.

## What's stubbed for later phases

The nav and routing already include **Tuner** and **Amp & Tone** — each
currently shows a "Coming soon" card describing what it will do (see
`src/features/{tuner,amp-tones}/`). Building these out is just replacing
the placeholder component; nothing else needs to change.

`src/features/songs/SongsPlaceholder.tsx` is now unused (the Songs page was
built out — see Phase 3 above) and can be deleted; it's left in place since
this environment doesn't have permission to delete files from your device.
Same for `src/components/practice/ConceptShapeBrowser.tsx` (superseded by
`MiniMusicTab.tsx` + `ShapeViewer.tsx` — see "Mini tabs & full-screen shape
viewer" above), and, as of Phase 5, `src/pages/Songs.tsx` plus its
`src/features/songs/` catalog components (superseded by the Songs → Tabs /
Chords dropdown — see "Songs is now Tabs + Chords" above) and
`src/pages/MyTabs.tsx` (folded into `src/pages/SongsTabs.tsx`).

## Project structure

```
src/
├── components/   Small reusable UI (layout shell, cards, progress bar,
│                 FretboardDiagram — legacy single-shape diagrams,
│                 FretShapeDiagram — one concept shape, labelMode-aware,
│                 MiniMusicTab + ShapeViewer — compact preview & full-screen
│                 multi-shape viewer, ConceptShapeBrowser — superseded/unused…)
├── pages/        Thin route components (one per URL) — SongsTabs.tsx and
│                 SongsChords.tsx (Phase 5) are the live Songs pages; the
│                 older Songs.tsx / MyTabs.tsx are unused (see "What's
│                 stubbed for later phases")
├── features/     Feature-specific UI, grouped by domain
│   ├── practice/     Session overview, active-exercise timer, summary
│   ├── progress/      Week bar chart
│   ├── metronome/     Timing engine (useMetronomeEngine, note subdivisions) + UI — implemented
│   ├── library/       Add/edit/delete custom exercises + "look up online" — implemented
│   ├── songs/         Song catalog, add/edit custom songs — unused as of Phase 5
│   ├── mytabs/        Import + alphaTab rendering/playback for your own tab
│   │                  files, plus SharedTabLibrary.tsx (Phase 5 shared folder) — implemented
│   ├── chords/        Phase 5: ChordLibraryGrid.tsx, SongLyricsView.tsx — implemented
│   ├── tuner/ amp-tones/   Phase 2/4 placeholders
├── data/         The exercise library and song catalog (source of truth) +
│                 concepts/ — music-concept content data (scales.ts,
│                 chords.ts, index.ts) + chordLibrary.ts (Phase 5 — the full
│                 12-root × major/minor Chord Library, hand-authored +
│                 generated) + demoSongs.ts (Phase 5 — original Song Lyrics
│                 demo dataset)
├── services/     Session generator + progress/stat calculations (pure functions) +
│                 tabFileStore.ts (IndexedDB for imported tab files) +
│                 tabShareApi.ts (Phase 5 — client for the tabs-server Docker service)
├── storage/      localStorage read/write, versioned schema
├── hooks/        useGuitool() — the app's central state (React context) +
│                 useTabFiles() — separate IndexedDB-backed hook for My Tabs +
│                 useShapeIndex() — shared shape-navigation logic for
│                 MiniMusicTab / ShapeViewer +
│                 useTheme() / useLocale() (Phase 5 — theme + i18n contexts)
├── i18n/         Phase 5 — languages.ts, translations.ts (typed TranslationKey
│                 dictionaries for English/Vietnamese/Japanese/Chinese/Spanish)
├── types/        Exercise / Session / Progress data models +
│                 musicConcept.ts — the reusable chord/scale/arpeggio/
│                 technique content model
└── utils/        date/time formatting, ids, a tiny sound helper +
                  fretboardNotes.ts — string/fret → note name, shared by
                  FretShapeDiagram's `labelMode="note"` +
                  chordpro.ts (Phase 5 — ChordPro-lite bracket-notation parser)
```

Also new at the project root: `docker/tabs-server/` (the Phase 5 shared-tabs
file-server) and `shared-tabs/` (the default folder it serves — empty and
git-ignored by default; drop your own tab files in there).

## Notes & known limitations

- Built and reviewed without a live `npm install` (the build sandbox this
  project was generated in had no network access), so it hasn't been
  smoke-tested against real `react`/`vite`/`tailwindcss` type
  declarations — only checked for internal type-consistency and manually
  reviewed. If `npm run build` turns up an issue, it's most likely a small
  one; look first at whichever file the error points to.
- The exercise library's content is original, written from general,
  well-established guitar-teaching concepts (alternate/economy/sweep
  picking, the CAGED system, pentatonic/blues scales, metronome
  subdivision practice, call-and-response improvisation, etc.) — not
  copied from any single source.
- The "Needs attention" and session-generator "weak area" signals are
  intentionally simple heuristics (low repetitions + high difficulty +
  staleness). They're meant to be a reasonable starting point, not a
  finished algorithm.
- Notifications/reminders, PWA/offline support, and import/export are
  Phase 6 and not started.
- The admin tab-import feature (see "Admin tab import" under Phase 5)
  intentionally has no automated external-source scraper (e.g. Ultimate
  Guitar) — it imports files an admin already has and asserts the rights
  to store, not ones fetched from a third-party site on the server's
  behalf. It also has no admin UI yet (API + CLI only), no database (a
  per-tab `metadata.json` plus a folder scan stands in for one), and its
  import rate limiter is in-memory/per-process only.
- The Chord Library's generated (non-hand-authored) shapes are pitch-class
  verified the same way the CAGED shapes are (see "Chord Library" under
  Phase 5) but, like everything else in this project, have not been played
  on a real guitar by a human to confirm they're comfortably fingerable —
  they're musically correct, not necessarily the easiest possible fingering.
- The dark/light theme is CSS custom properties, not Tailwind's `dark:`
  variant, so existing component classes needed no per-component changes
  (see "Dark mode & language" under Phase 5) — but the language picker only
  translates nav/shell chrome, not page content, which stays English-only.
- The song catalog's technical details (tuning, capo, key) are only filled
  in where they're well-established/near-universal across sources — several
  fields are left blank on songs where the "right" capo position or exact
  tempo varies too much by recording/arrangement to state as fact.
- The fret-position diagrams' note/finger data was double-checked
  programmatically (each string/fret computed from open-string pitch class
  + fret number, not just typed from memory) before being written into
  `src/data/exercises.ts`, since a wrong note in a diagram like this
  actively misleads a learner rather than just being a code bug. The
  fingerings shown are one common, standard way to play each shape — not
  the only correct one.
- Same for the Phase 4 concept data (`src/data/concepts/`): every shape's
  string/fret/role was computed programmatically from pitch class, and the
  CAGED shapes were cross-checked two independent ways (hand-derived barre-
  chord theory, then re-derived by transposing each open chord's own shape
  by the semitone offset needed to land on G) before being written in.
  Barre-heavy CAGED shapes (C/A/D) intentionally leave `finger` unset on
  some notes — real fingering for those varies by hand size, so a single
  asserted fingering would be more confident than the truth. Same method
  for the newer C major / A minor barre and alternative voicings, and for
  every `interval` label on the Minor/Major Pentatonic shapes (computed
  from pitch class against the standard pentatonic degree formula, then
  cross-checked against which notes were already marked `root`).
- `ShapeViewer.tsx`'s keyboard, focus-trap, swipe-gesture and
  reduced-motion behavior was written carefully and reviewed by hand, but
  this environment has no real browser or touch device to test it in —
  only the manual TypeScript check and code review were possible here. If
  anything feels off (a focus edge case, a swipe threshold that's too
  sensitive/insensitive), that's the first place to check by hand.
