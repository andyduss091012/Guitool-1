#!/usr/bin/env node
/**
 * Parity check: does the API serve the same built-in content the web app has locally?
 *
 * "Local" here is the seed folder (backend/tools/GuitarApp.Importer/seed): `export-seed.mjs` writes it from the web app's own
 * typed modules and `build-chord-voicings.mjs` writes the chord voicings that `src/data/chordVoicings.generated.ts` mirrors.
 * "API" is a running backend that has been loaded by the importer.
 *
 * Checks
 *   songs   every seed song exists in the API with the same title, artist, genre, difficulty, tuning, capo, key,
 *           tags and practice notes (all five languages); the API has no extra built-in songs.
 *   chords  for every (root, quality) the web library shows, the API's chord library has exactly the same set of fret
 *           patterns (chords-db voicings for the root's enharmonic key + the hand-authored shapes), and no extra chords.
 *
 * Usage (from web/):  node scripts/check-data-parity.mjs [--api http://localhost:5080] [--seed <dir>]
 * Exit code 0 = identical, 1 = differences (listed), 2 = could not run (API unreachable, seed missing).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..', '..')
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const apiBase = arg('--api', 'http://localhost:5080').replace(/\/+$/, '')
const seedDir = path.resolve(arg('--seed', path.join(repoRoot, 'backend', 'tools', 'GuitarApp.Importer', 'seed')))

const read = (file) => {
  const p = path.join(seedDir, file)
  if (!fs.existsSync(p)) {
    console.error(`Seed file not found: ${p} (run \`node scripts/export-seed.mjs\` and \`node scripts/build-chord-voicings.mjs\` first)`)
    process.exit(2)
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

async function get(pathAndQuery) {
  let res
  try {
    res = await fetch(`${apiBase}${pathAndQuery}`, { headers: { Accept: 'application/json' } })
  } catch {
    console.error(`Could not reach the API at ${apiBase}. Is it running (docker compose up -d api) and loaded (importer)?`)
    process.exit(2)
  }
  if (!res.ok) {
    console.error(`${pathAndQuery} -> ${res.status} ${res.statusText}`)
    process.exit(2)
  }
  return res.json()
}

const problems = []
const report = (area, message) => problems.push(`${area}: ${message}`)

// ---------- songs ----------
const LANGS = ['en', 'vi', 'ja', 'zh', 'es']
const text = (value) => {
  const obj = typeof value === 'string' ? { en: value } : (value ?? {})
  return Object.fromEntries(LANGS.map((l) => [l, obj[l] ?? null]))
}
const tagSet = (tags) => [...new Set((tags ?? []).map((t) => String(t).trim().toLowerCase()))].sort()

const seedSongs = read('songs.json')
const apiSongs = []
for (let page = 1; ; page++) {
  const result = await get(`/api/songs?page=${page}&pageSize=100`)
  apiSongs.push(...result.items)
  if (!result.hasNextPage) break
}
const apiSongById = new Map(apiSongs.map((s) => [s.id, s]))
for (const s of seedSongs) {
  const a = apiSongById.get(s.slug)
  if (!a) {
    report('songs', `missing in API: ${s.slug}`)
    continue
  }
  const same = (field, x, y) => {
    if (JSON.stringify(x ?? null) !== JSON.stringify(y ?? null)) report('songs', `${s.slug}.${field}: local ${JSON.stringify(x ?? null)} vs API ${JSON.stringify(y ?? null)}`)
  }
  same('title', s.title, a.title)
  same('artist', s.artist, a.artist)
  same('genre', s.genre, a.genre)
  same('difficulty', s.difficulty, a.difficulty)
  same('tuning', s.tuning, a.tuning)
  same('capo', s.capo, a.capo)
  same('keySignature', s.keySignature, a.keySignature)
  same('tags', tagSet(s.tags), tagSet(a.tags))
  same('practiceNotes', text(s.practiceNotes), text(a.practiceNotes))
}
const seedSlugs = new Set(seedSongs.map((s) => s.slug))
for (const a of apiSongs) if (!seedSlugs.has(a.id)) report('songs', `only in API: ${a.id}`)

// ---------- chords ----------
// Keep in sync with ConceptMapper.ChordConceptTargets (backend) and AUTHORED_CHORD_TARGETS (web/src/data/chordLibrary.ts).
const AUTHORED_TARGETS = {
  'chord-open-a-major': ['A', 'maj'],
  'chord-open-a-minor': ['A', 'm'],
  'chord-open-c-major': ['C', 'maj'],
  'chord-open-d-major': ['D', 'maj'],
  'chord-open-e-major': ['E', 'maj'],
  'chord-open-e-minor': ['E', 'm'],
  'chord-open-g-major': ['G', 'maj'],
  'chord-caged-major-g': ['G', 'maj'],
}

const expected = new Map() // "root|quality" -> Set of "frets"
const add = (root, quality, frets) => {
  const key = `${root}|${quality}`
  if (!expected.has(key)) expected.set(key, new Set())
  expected.get(key).add(frets.join(','))
}

const db = read('chord-voicings.json')
for (const chord of db.chords) {
  for (const [root, key] of Object.entries(db.rootToKey)) {
    if (key !== chord.key) continue
    for (const v of chord.voicings) add(root, chord.quality, v.frets)
  }
}
for (const concept of read('concepts.json')) {
  const target = AUTHORED_TARGETS[concept.id]
  if (!target) continue
  for (const shape of concept.shapes) {
    const frets = [0, 0, 0, 0, 0, 0]
    for (const s of shape.mutedStrings ?? []) frets[s - 1] = -1
    for (const p of shape.positions) frets[p.string - 1] = p.fret
    add(target[0], target[1], frets)
  }
}

const library = await get('/api/chords/library')
const actual = new Map()
for (const chord of library) {
  const set = new Set()
  for (const v of chord.voicings) if (v.frets) set.add(v.frets.join(','))
  actual.set(`${chord.root}|${chord.quality}`, set)
}

let missingChords = 0
let voicingDiffs = 0
for (const [key, want] of expected) {
  const have = actual.get(key)
  if (!have) {
    missingChords++
    if (missingChords <= 20) report('chords', `missing in API: ${key.replace('|', ' ')}`)
    continue
  }
  const lacking = [...want].filter((f) => !have.has(f))
  const extra = [...have].filter((f) => !want.has(f))
  if (lacking.length || extra.length) {
    voicingDiffs++
    if (voicingDiffs <= 20) report('chords', `${key.replace('|', ' ')}: missing in API [${lacking.join(' | ')}], only in API [${extra.join(' | ')}]`)
  }
}
let extraChords = 0
for (const key of actual.keys()) {
  if (!expected.has(key)) {
    extraChords++
    if (extraChords <= 20) report('chords', `only in API: ${key.replace('|', ' ')}`)
  }
}
if (missingChords > 20) report('chords', `… ${missingChords - 20} more chords missing in API`)
if (voicingDiffs > 20) report('chords', `… ${voicingDiffs - 20} more chords with different voicings`)
if (extraChords > 20) report('chords', `… ${extraChords - 20} more chords only in API`)

// ---------- result ----------
const voicingCount = [...expected.values()].reduce((n, s) => n + s.size, 0)
console.log(`songs : ${seedSongs.length} local, ${apiSongs.length} from API`)
console.log(`chords: ${expected.size} local (${voicingCount} fret patterns), ${actual.size} from API`)
if (problems.length === 0) {
  console.log('PARITY OK — the API serves the same built-in songs and chord shapes as the local data.')
} else {
  console.error(`\n${problems.length} difference(s):`)
  for (const p of problems) console.error(' - ' + p)
  process.exit(1)
}
