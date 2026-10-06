#!/usr/bin/env node
/**
 * Exports Guitool's built-in content (typed TS modules under src/data) to
 * plain JSON seed files for the backend importer
 * (`backend/tools/GuitarApp.Importer/seed/`). See docs/agent-log/DECISIONS.md.
 *
 * Read-only with respect to the app: it never edits anything under src/.
 * The TS modules stay the source of truth until Phase 6; re-run this script
 * after changing them (output is deterministic: no timestamps, stable order),
 * so a clean `git diff` on the seed folder means "nothing changed".
 *
 * Usage (from web/):  node scripts/export-seed.mjs [--out <dir>]
 *
 * How it loads TS without a runner: every .ts file under src/{data,types,
 * utils,i18n} is transpiled to CommonJS with the project's own `typescript`
 * package (transpile-only, no type-check) into a temp dir, then required.
 * No extra dependencies.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(here, '..')
const repoRoot = path.resolve(webRoot, '..')
const require = createRequire(path.join(webRoot, 'package.json'))
const ts = require('typescript')

const outArgIdx = process.argv.indexOf('--out')
const outDir = outArgIdx > -1 ? path.resolve(process.argv[outArgIdx + 1]) : path.join(repoRoot, 'backend', 'tools', 'GuitarApp.Importer', 'seed')

// ---------- 1. transpile the needed source folders into a temp dir ----------
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guitool-seed-'))
const srcRoot = path.join(webRoot, 'src')
const FOLDERS = ['data', 'types', 'utils', 'i18n']

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : e.name.endsWith('.ts') ? [p] : []
  })
}

for (const folder of FOLDERS) {
  for (const file of walk(path.join(srcRoot, folder))) {
    const rel = path.relative(srcRoot, file)
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: file,
    })
    const dest = path.join(buildDir, rel.replace(/\.ts$/, '.js'))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, outputText)
  }
}
// The transpiled files are CommonJS; make sure Node doesn't treat them as ESM.
fs.writeFileSync(path.join(buildDir, 'package.json'), '{"type":"commonjs"}')

const load = (rel) => require(path.join(buildDir, rel))
const { EXERCISES } = load('data/exercises.js')
const { SONGS } = load('data/songs.js')
const { MUSIC_CONCEPTS } = load('data/concepts/index.js')
const { CHORD_FINGERS_RAW } = load('data/chordFingersRaw.js')
const { CHORD_TYPE_LABELS } = load('data/chordLibrary.js')

// ---------- 2. helpers ----------
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const sortBy = (arr, key) => [...arr].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
const write = (name, data) => {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + '\n')
}

// ---------- 3. datasets ----------
// Exercises / concepts keep their full shape (including any LocalizedText
// objects) — the importer maps them; nothing is dropped.
const exercises = EXERCISES.map((e) => ({ ...e, slug: e.id }))
const concepts = MUSIC_CONCEPTS

// Songs keep their string id as `slug` (ids are persisted in users' progress).
const songs = SONGS.map((s) => ({ ...s, slug: s.id, artistSlug: slugify(s.artist) }))

const artistNames = [...new Set(SONGS.map((s) => s.artist))]
const artists = sortBy(
  artistNames.map((name) => ({ name, slug: slugify(name) })),
  (a) => a.slug,
)
const slugClash = artists.length - new Set(artists.map((a) => a.slug)).size

const tunings = [{ name: 'Standard (EADGBE)', notes: 'E A D G B E' }]

// Chord CSV tuples -> grouped chords with int[6] voicings (-1 = muted, 0 = open),
// array order = string 1 (low E) … string 6 (high e), as in the source.
const chordMap = new Map()
for (const [root, quality, fretsStr] of CHORD_FINGERS_RAW) {
  const key = `${root}|${quality}`
  if (!chordMap.has(key)) chordMap.set(key, { root, quality, label: CHORD_TYPE_LABELS[quality] ?? quality, voicings: [] })
  const frets = fretsStr.split(',').map((f) => (f.trim().toLowerCase() === 'x' ? -1 : Number(f)))
  chordMap.get(key).voicings.push({ index: chordMap.get(key).voicings.length, frets })
}
const chords = [...chordMap.values()]
const badVoicings = chords.flatMap((c) => c.voicings).filter((v) => v.frets.length !== 6 || v.frets.some((n) => !Number.isInteger(n)))

// Tab files: manifest only (the binaries are NOT copied anywhere). Rights are
// "unverified" until a human clears them (DECISIONS.md, Q4).
const tabsDir = path.join(webRoot, 'shared-tabs')
const TAB_EXT = new Set(['.gp', '.gp3', '.gp4', '.gp5', '.gp7', '.gpx'])
const tabFiles = fs.existsSync(tabsDir)
  ? fs.readdirSync(tabsDir).filter((f) => TAB_EXT.has(path.extname(f).toLowerCase())).sort()
  : []
const formatOf = (buf, ext) => {
  const head = buf.subarray(0, 32).toString('latin1')
  if (head.includes('FICHIER GUITAR PRO v3')) return 'gp3'
  if (head.includes('FICHIER GUITAR PRO v4')) return 'gp4'
  if (head.includes('FICHIER GUITAR PRO v5')) return 'gp5'
  if (buf[0] === 0x50 && buf[1] === 0x4b) return ext === '.gpx' ? 'gpx' : 'gp' // zip-based (GP6/GP7+)
  return ext.slice(1)
}
const tabs = tabFiles.map((fileName) => {
  const buf = fs.readFileSync(path.join(tabsDir, fileName))
  const ext = path.extname(fileName).toLowerCase()
  const base = path.basename(fileName, path.extname(fileName))
  const m = base.match(/^(.+?)\s+-\s+(.+)$/)
  const artist = m ? m[1].trim() : null
  const title = m ? m[2].trim() : base
  // Only an exact artist match + title prefix match links to a Song; everything else is reported as unmatched.
  const match = SONGS.find((s) => artist && norm(s.artist) === norm(artist) && norm(s.title).startsWith(norm(title)))
  return {
    fileName,
    format: formatOf(buf, ext),
    sizeBytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    titleGuess: title,
    artistGuess: artist,
    songSlug: match ? match.id : null,
    rightsStatus: 'unverified',
  }
})

// ---------- 4. write ----------
write('exercises.json', sortBy(exercises, (e) => e.slug))
write('songs.json', sortBy(songs, (s) => s.slug))
write('artists.json', artists)
write('tunings.json', tunings)
write('concepts.json', sortBy(concepts, (c) => c.id))
write('chords.json', sortBy(chords, (c) => `${c.root}|${c.quality}`))
write('tabs.manifest.json', tabs)
const meta = {
  exercises: exercises.length,
  songs: songs.length,
  artists: artists.length,
  tunings: tunings.length,
  concepts: concepts.length,
  conceptShapes: concepts.reduce((n, c) => n + (c.shapes?.length ?? 0), 0),
  chords: chords.length,
  chordVoicings: chords.reduce((n, c) => n + c.voicings.length, 0),
  tabFiles: tabs.length,
  tabFilesMatchedToSongs: tabs.filter((t) => t.songSlug).length,
  warnings: { artistSlugClashes: slugClash, malformedVoicings: badVoicings.length },
}
write('_meta.json', meta)

fs.rmSync(buildDir, { recursive: true, force: true })
console.log(`Seed written to ${outDir}`)
console.log(JSON.stringify(meta, null, 2))
if (slugClash || badVoicings.length) {
  console.error('WARNING: data-quality warnings above are non-zero')
  process.exitCode = 1
}
