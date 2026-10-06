#!/usr/bin/env node
/**
 * Converts the vendored chords-db guitar data (MIT, see THIRD-PARTY-NOTICES.md) into:
 *   - backend/tools/GuitarApp.Importer/seed/chord-voicings.json   (read by the backend importer)
 *   - backend/tools/GuitarApp.Importer/seed/chord-voicings.report.json (what was checked / skipped)
 *   - web/src/data/chordVoicings.generated.ts                       (read by the web app's chord library)
 *
 * SECURITY: only DATA is used. The script never executes anything from the package, refuses to run if the vendored
 * guitar.json does not match the pinned SHA-256 (use --accept-new-hash after reviewing a data update), and rejects
 * (does not repair) any structurally invalid record.
 *
 * KEY FACT: chords-db `frets` are RELATIVE to `baseFret`: actual fret = frets[i] + baseFret - 1 for frets[i] > 0
 * (-1 = muted, 0 = open stay as they are). This is verified for every voicing against the dataset's own `midi` array.
 *
 * Usage (from web/):  node scripts/build-chord-voicings.mjs [--accept-new-hash]
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(here, '..')
const repoRoot = path.resolve(webRoot, '..')
const vendorDir = path.join(repoRoot, 'backend', 'tools', 'GuitarApp.Importer', 'third-party', 'chords-db', 'package')
const seedDir = path.join(repoRoot, 'backend', 'tools', 'GuitarApp.Importer', 'seed')
const tsOut = path.join(webRoot, 'src', 'data', 'chordVoicings.generated.ts')

const PINNED = {
  package: '@tombatossals/chords-db',
  version: '0.5.1',
  license: 'MIT',
  copyright: 'Copyright (c) 2016 David Rubert',
  guitarJsonSha256: '23731147b3d070fa59b30e79570818a9689f126f76e77b04899d73934ba54d4e',
}
const acceptNewHash = process.argv.includes('--accept-new-hash')

// chords-db suffix -> this app's quality code (see web/src/data/chordLibrary.ts TYPE_ORDER). Anything not listed is skipped and reported.
const SUFFIX_TO_QUALITY = {
  major: 'maj', minor: 'm', dim: 'dim', dim7: 'dim7', sus2: 'sus2', sus4: 'sus4', '7sus4': '7sus4', aug: 'aug',
  '6': '6', '69': '6/9', '7': '7', '7b5': '7b5', aug7: '7(#5)', '9': '9', '9b5': '9b5', aug9: '9(#5)',
  '7b9': '7(b9)', '7#9': '7(#9)', '11': '11', '9#11': '9(#11)', '13': '13', maj7: 'maj7', maj9: 'maj9', maj13: 'maj13',
  m6: 'm6', m69: 'm6/9', m7: 'm7', m7b5: 'm7b5', m9: 'm9', m11: 'm11', mmaj7: 'm(maj7)', mmaj9: 'm(maj9)', add9: 'add9',
}

// Each of this app's root spellings -> the chords-db key with the SAME pitch (enharmonic twins share voicings).
const ROOT_TO_KEY = {
  A: 'A', 'A#': 'Bb', Ab: 'Ab', B: 'B', Bb: 'Bb', C: 'C', 'C#': 'C#', Cb: 'B', D: 'D', 'D#': 'Eb', Db: 'C#',
  E: 'E', Eb: 'Eb', F: 'F', 'F#': 'F#', G: 'G', 'G#': 'Ab', Gb: 'F#',
}

// Chord tones that must be sounded for the symbol to be honest (semitones above the root). Extensions that are
// commonly omitted in real voicings (5th, root of rich chords) are NOT required.
const REQUIRED = {
  major: [4], minor: [3], dim: [3, 6], dim7: [3, 6, 9], sus2: [2], sus4: [5], '7sus4': [5, 10], aug: [4, 8], '6': [4, 9],
  '7': [4, 10], '7b5': [4, 6, 10], aug7: [4, 8, 10], '9': [4, 10], '9b5': [4, 6, 10], aug9: [4, 8, 10], '7b9': [4, 10],
  '7#9': [4, 10], '11': [10], '9#11': [4, 10], '13': [4, 10], maj7: [4, 11], maj9: [4, 11], maj13: [4, 11], m6: [3, 9],
  '69': [4, 9], m69: [3, 9], m7: [3, 10], m7b5: [3, 6, 10], m9: [3, 10], m11: [3, 10], mmaj7: [3, 11], mmaj9: [3, 11], add9: [4, 2],
}
const KEY_PC = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
const OPEN_MIDI = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4, low E first (this app's string order)

// ---------- 1. load + verify the vendored file ----------
const guitarPath = path.join(vendorDir, 'lib', 'guitar.json')
if (!fs.existsSync(guitarPath)) fail(`Vendored data not found: ${guitarPath}`)
const raw = fs.readFileSync(guitarPath)
const sha = crypto.createHash('sha256').update(raw).digest('hex')
if (sha !== PINNED.guitarJsonSha256 && !acceptNewHash) {
  fail(`guitar.json SHA-256 is ${sha} but ${PINNED.guitarJsonSha256} is pinned.\nReview the data update, then re-run with --accept-new-hash and update PINNED + THIRD-PARTY-NOTICES.md.`)
}
const pkg = JSON.parse(fs.readFileSync(path.join(vendorDir, 'package.json'), 'utf8'))
if (pkg.name !== PINNED.package || pkg.version !== PINNED.version || pkg.license !== PINNED.license) {
  if (!acceptNewHash) fail(`Vendored package is ${pkg.name}@${pkg.version} (${pkg.license}); expected ${PINNED.package}@${PINNED.version} (${PINNED.license}).`)
}
const data = JSON.parse(raw.toString('utf8'))
if (data.main?.strings !== 6 || !data.chords || typeof data.chords !== 'object') fail('Unexpected guitar.json layout (expected 6 strings and a "chords" object).')
if (JSON.stringify(data.tunings?.standard) !== JSON.stringify(['E2', 'A2', 'D3', 'G3', 'B3', 'E4'])) fail('Unexpected tuning in guitar.json.')

// ---------- 2. convert + validate ----------
const isInt = (n) => Number.isInteger(n)
const report = { source: { ...PINNED, guitarJsonSha256: sha }, totals: {}, skippedSuffixes: {}, rejected: [], toneWarnings: [], fingerWarnings: [] }
const chords = []
let positionsSeen = 0
let positionsKept = 0

for (const list of Object.values(data.chords)) {
  for (const c of list) {
    const quality = SUFFIX_TO_QUALITY[c.suffix]
    if (!quality) {
      report.skippedSuffixes[c.suffix] = (report.skippedSuffixes[c.suffix] ?? 0) + c.positions.length
      positionsSeen += c.positions.length
      continue
    }
    if (!(c.key in KEY_PC)) fail(`Unknown key "${c.key}".`)
    const voicings = []
    c.positions.forEach((p, i) => {
      positionsSeen++
      const where = `${c.key} ${c.suffix} #${i}`
      const bad = (why) => report.rejected.push(`${where}: ${why}`)
      if (!Array.isArray(p.frets) || p.frets.length !== 6 || !p.frets.every(isInt)) return bad('frets must be 6 integers')
      if (!Array.isArray(p.fingers) || p.fingers.length !== 6 || !p.fingers.every(isInt)) return bad('fingers must be 6 integers')
      if (!isInt(p.baseFret) || p.baseFret < 1 || p.baseFret > 20) return bad('baseFret out of range')
      if (p.frets.some((f) => f < -1 || f > 4)) return bad('relative frets must be -1..4')

      const frets = p.frets.map((f) => (f > 0 ? f + p.baseFret - 1 : f))
      // Independent check against the dataset's own MIDI notes (catches a wrong baseFret interpretation outright).
      const midi = frets.map((f, s) => (f >= 0 ? OPEN_MIDI[s] + f : null)).filter((m) => m !== null)
      if (JSON.stringify(midi) !== JSON.stringify(p.midi)) return bad(`midi mismatch (computed ${midi} vs source ${p.midi})`)
      if (frets.some((f) => f > 24)) return bad('fret above 24')

      // Fingers: -1 where the string is muted; a finger number only where a string is fretted.
      const fingers = p.fingers.map((f, s) => (frets[s] === -1 ? -1 : f))
      if (fingers.some((f) => f < -1 || f > 4)) return bad('finger out of range')
      frets.forEach((f, s) => {
        if ((f > 0) !== (fingers[s] > 0)) report.fingerWarnings.push(`${where}: string ${s + 1} fret ${f} finger ${fingers[s]}`)
      })

      // Chord-tone sanity check (warning only: real voicings often omit tones).
      const rootPc = KEY_PC[c.key]
      const rel = new Set(midi.map((m) => (((m - rootPc) % 12) + 12) % 12))
      const missing = (REQUIRED[c.suffix] ?? []).filter((iv) => !rel.has(iv))
      if (missing.length) {
        // A voicing that omits a defining tone would be mislabelled in the UI, so it is excluded (and listed in the report).
        report.toneWarnings.push(`${where} frets ${frets.join(',')} lacks intervals ${missing.join(',')} -> EXCLUDED`)
        return
      }

      const barres = (p.barres ?? []).map((b) => b + p.baseFret - 1)
      voicings.push({ frets, fingers, baseFret: p.baseFret, barres })
      positionsKept++
    })
    if (voicings.length) chords.push({ key: c.key, quality, suffix: c.suffix, voicings })
  }
}

const KEYS_ORDER = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
chords.sort((a, b) => KEYS_ORDER.indexOf(a.key) - KEYS_ORDER.indexOf(b.key) || a.quality.localeCompare(b.quality))

const sharedKeys = new Set(Object.values(ROOT_TO_KEY))
for (const k of KEYS_ORDER) if (!sharedKeys.has(k)) fail(`ROOT_TO_KEY never uses chords-db key ${k}`)

// Warn when a mapped quality is not one of this app's known quality codes.
const rawTs = fs.readFileSync(path.join(webRoot, 'src', 'data', 'chordFingersRaw.ts'), 'utf8')
const knownQualities = new Set([...rawTs.matchAll(/\['[^']+',\s*'([^']+)',/g)].map((m) => m[1]))
for (const q of new Set(Object.values(SUFFIX_TO_QUALITY))) if (!knownQualities.has(q)) report.rejected.push(`mapping: quality "${q}" is not in chordFingersRaw.ts`)

report.totals = {
  chordsDbPositions: positionsSeen,
  positionsKept,
  chordKeyQualityPairs: chords.length,
  skippedPositions: Object.values(report.skippedSuffixes).reduce((a, b) => a + b, 0),
  rejected: report.rejected.length,
  toneWarnings: report.toneWarnings.length,
  fingerWarnings: report.fingerWarnings.length,
}

// ---------- 3. write outputs ----------
fs.mkdirSync(seedDir, { recursive: true })
const seed = {
  source: report.source,
  rootToKey: ROOT_TO_KEY,
  chords: chords.map((c) => ({ key: c.key, quality: c.quality, suffix: c.suffix, voicings: c.voicings })),
}
fs.writeFileSync(path.join(seedDir, 'chord-voicings.json'), JSON.stringify(seed, null, 1) + '\n')
fs.writeFileSync(path.join(seedDir, 'chord-voicings.report.json'), JSON.stringify(report, null, 2) + '\n')

// Compact TS for the web app: voicing = "frets/fingers@baseFret" with x for muted strings and 0 for no finger.
const enc = (v) => `${v.frets.map((f) => (f === -1 ? 'x' : f)).join(',')}/${v.fingers.map((f) => (f > 0 ? f : 0)).join(',')}@${v.baseFret}`
const tsLines = [
  '/* eslint-disable */',
  '// AUTO-GENERATED by scripts/build-chord-voicings.mjs — do not edit by hand.',
  `// Source: ${PINNED.package}@${PINNED.version} (${PINNED.license}, ${PINNED.copyright}). See THIRD-PARTY-NOTICES.md.`,
  `// guitar.json sha256: ${sha}`,
  '',
  `export const CHORD_VOICINGS_SOURCE = ${JSON.stringify({ package: PINNED.package, version: PINNED.version, license: PINNED.license, copyright: PINNED.copyright })} as const`,
  '',
  '/** This app\'s root spelling -> the chords-db key with the same pitch (enharmonic twins share voicings). */',
  `export const CHORD_ROOT_TO_KEY: Record<string, string> = ${JSON.stringify(ROOT_TO_KEY)}`,
  '',
  '/** [chords-db key, quality code, voicings as "frets/fingers@baseFret"] — frets are ABSOLUTE (x = muted, 0 = open). */',
  'export const CHORD_VOICINGS_RAW: readonly (readonly [string, string, readonly string[]])[] = [',
  ...chords.map((c) => `  [${JSON.stringify(c.key)}, ${JSON.stringify(c.quality)}, ${JSON.stringify(c.voicings.map(enc))}],`),
  ']',
  '',
]
fs.writeFileSync(tsOut, tsLines.join('\n'))

console.log(JSON.stringify(report.totals, null, 2))
console.log('skipped suffixes:', JSON.stringify(report.skippedSuffixes))
if (report.rejected.length) {
  console.error('REJECTED RECORDS:\n' + report.rejected.join('\n'))
  process.exitCode = 1
}

function fail(msg) {
  console.error(`ERROR: ${msg}`)
  process.exit(2)
}
