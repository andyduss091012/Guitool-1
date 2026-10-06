import type { FingerNumber, FretPositionRole, FretShape, StringNumber } from '../types/musicConcept'
import { CHORD_ROOT_TO_KEY, CHORD_VOICINGS_RAW } from './chordVoicings.generated'
import { CHORD_CONCEPTS } from './concepts/chords'

/**
 * The Chord Library — sourced from the `chord-fingers.csv` dataset the user
 * supplied (see `chordFingersRaw.ts` for the raw `[root, type, frets]` data
 * and how it was cleaned up), grouped by root/tone first and chord type
 * second (e.g. "A" → A major, A minor, A7, Am7, A7(#9), …) rather than the
 * major/minor split this file used before.
 *
 * The CSV gives fret positions (`FINGER_POSITIONS`) directly, so those are
 * trusted as-is. It also has its own `NOTE_NAMES` and `CHORD_STRUCTURE`
 * (scale-degree) columns, but cross-checking those against the actual pitch
 * classes the fret positions produce showed they agree on only a small
 * fraction of rows — real chord voicings, especially the extended jazz
 * chords this dataset is full of, routinely omit or substitute textbook
 * degrees, so a strict "must match CHORD_STRUCTURE" check would reject a
 * lot of perfectly normal chords. Rather than depend on those two columns,
 * every note's role (root/third/fifth/other) below is derived independently
 * from the fret position itself, using the same pitch-class arithmetic as
 * the rest of this app's chord data: a fretted note's pitch class is
 * `(openStringPitchClass + fret) mod 12`, and its role relative to the
 * chord's root falls out of the interval between the two.
 */

// String numbering matches `FretShapeDiagram`'s STRING_LABELS: 1 = low E … 6 = high e.
const OPEN_STRING_PITCH_CLASS: Record<StringNumber, number> = { 1: 4, 2: 9, 3: 2, 4: 7, 5: 11, 6: 4 }

/** Every root the CSV uses, in the order the library displays them — alphabetical by letter, natural before sharp before flat. */
export const ROOT_ORDER = [
  'A',
  'A#',
  'Ab',
  'B',
  'Bb',
  'C',
  'C#',
  'Cb',
  'D',
  'D#',
  'Db',
  'E',
  'Eb',
  'F',
  'F#',
  'G',
  'G#',
  'Gb',
] as const
export type RootName = (typeof ROOT_ORDER)[number]

/** Every chord-type code the CSV uses, in a sensible browsing order (triads, then 6ths, 7ths, extensions, sus, altered dominants, diminished/augmented last). */
const TYPE_ORDER = [
  'maj',
  'm',
  '5',
  '6',
  'm6',
  '6/9',
  'm6/9',
  '6(#11)',
  'maj7',
  'm7',
  'm(maj7)',
  'maj9',
  'm9',
  'm(maj9)',
  'maj13',
  'add9',
  'sus2',
  'sus4',
  '7sus4',
  '7',
  '7b5',
  '7(#5)',
  '7(#9)',
  '7(b9)',
  '7(b13)',
  '7(#11)',
  '9',
  '9b5',
  '9(#5)',
  '9(#11)',
  '11',
  'm11',
  '13',
  'm13',
  '13(b9)',
  '13(#9)',
  '13(#11)',
  'dim',
  'dim7',
  'm7b5',
  'aug',
  '+(#11)',
] as const
export type ChordType = (typeof TYPE_ORDER)[number]

const TYPE_INDEX: Record<string, number> = Object.fromEntries(TYPE_ORDER.map((t, i) => [t, i]))

/** Human-readable name for each chord-type code, shown under the chord symbol in the UI. */
export const CHORD_TYPE_LABELS: Record<ChordType, string> = {
  maj: 'Major',
  m: 'Minor',
  '5': 'Power chord (5)',
  '6': '6th',
  m6: 'Minor 6th',
  '6/9': '6/9',
  'm6/9': 'Minor 6/9',
  '6(#11)': '6(♯11)',
  maj7: 'Major 7th',
  m7: 'Minor 7th',
  'm(maj7)': 'Minor (Major 7th)',
  maj9: 'Major 9th',
  m9: 'Minor 9th',
  'm(maj9)': 'Minor (Major 9th)',
  maj13: 'Major 13th',
  add9: 'Add 9',
  sus2: 'Suspended 2nd',
  sus4: 'Suspended 4th',
  '7sus4': '7sus4',
  '7': 'Dominant 7th',
  '7b5': '7(♭5)',
  '7(#5)': '7(♯5)',
  '7(#9)': '7(♯9)',
  '7(b9)': '7(♭9)',
  '7(b13)': '7(♭13)',
  '7(#11)': '7(♯11)',
  '9': '9th',
  '9b5': '9(♭5)',
  '9(#5)': '9(♯5)',
  '9(#11)': '9(♯11)',
  '11': '11th',
  m11: 'Minor 11th',
  '13': '13th',
  m13: 'Minor 13th',
  '13(b9)': '13(♭9)',
  '13(#9)': '13(♯9)',
  '13(#11)': '13(♯11)',
  dim: 'Diminished',
  dim7: 'Diminished 7th',
  m7b5: 'Minor 7(♭5) (half-diminished)',
  aug: 'Augmented',
  '+(#11)': 'Augmented (♯11)',
}

const NATURAL_PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Pitch class (0–11) of any of the CSV's root spellings, naturals/sharps/flats alike — same accidental math used throughout this app. */
/**
 * WHERE THE DIAGRAMS COME FROM. The original `chord-fingers.csv` dataset stores FINGER numbers (0 = open, 1-4,
 * x = muted), not fret numbers (open G is `2,1,0,0,0,3`, real frets 3-2-0-0-0-3), so it can't be drawn as frets and
 * is no longer used for diagrams. Real fret data comes from @tombatossals/chords-db (MIT), converted and checked by
 * `scripts/build-chord-voicings.mjs` into `chordVoicings.generated.ts` (absolute frets, per-position fingers, base
 * fret). The hand-authored shapes in `concepts/chords.ts` are shown first, then the dataset voicings. A chord only
 * appears in the library when it has at least one shape. Credit: THIRD-PARTY-NOTICES.md. The backend importer
 * applies the same rules (see docs/agent-log/DECISIONS.md).
 */
const AUTHORED_CHORD_TARGETS: Record<string, { root: RootName; type: ChordType }> = {
  'chord-open-a-major': { root: 'A', type: 'maj' },
  'chord-open-a-minor': { root: 'A', type: 'm' },
  'chord-open-c-major': { root: 'C', type: 'maj' },
  'chord-open-d-major': { root: 'D', type: 'maj' },
  'chord-open-e-major': { root: 'E', type: 'maj' },
  'chord-open-e-minor': { root: 'E', type: 'm' },
  'chord-open-g-major': { root: 'G', type: 'maj' },
  'chord-caged-major-g': { root: 'G', type: 'maj' },
}

/** Frets per string (low E first): muted = -1, listed note = its fret, any other string = open (0). */
function fretsOf(shape: FretShape): number[] {
  const frets = [0, 0, 0, 0, 0, 0]
  for (const s of shape.mutedStrings ?? []) frets[s - 1] = -1
  for (const p of shape.positions) frets[p.string - 1] = p.fret
  return frets
}

function authoredShapesFor(root: RootName, type: ChordType): FretShape[] {
  const seen = new Set<string>()
  const shapes: FretShape[] = []
  for (const [conceptId, target] of Object.entries(AUTHORED_CHORD_TARGETS)) {
    if (target.root !== root || target.type !== type) continue
    const concept = CHORD_CONCEPTS.find((c) => c.id === conceptId)
    for (const shape of concept?.shapes ?? []) {
      const signature = fretsOf(shape).join(',')
      if (seen.has(signature)) continue // same fingering shown by two concepts (e.g. open G and the CAGED G-shape)
      seen.add(signature)
      shapes.push(shape)
    }
  }
  return shapes
}

export interface LibraryChord {
  id: string
  root: RootName
  type: ChordType
  typeLabel: string
  /** Chord symbol as it'd be written on a chart, e.g. "A", "Am7", "C#dim7". */
  name: string
  description: string
  shapes: FretShape[]
}

/** How a chord type reads right after the root letter — blank for a plain major triad, the type code otherwise. */
function symbolFor(type: string): string {
  return type === 'maj' ? '' : type
}

function pitchClassOf(root: string): number {
  const natural = NATURAL_PITCH_CLASS[root[0]]
  const accidental = root.slice(1)
  return (natural + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0) + 12) % 12
}

function roleFor(string: StringNumber, fret: number, rootPc: number): FretPositionRole {
  const interval = (OPEN_STRING_PITCH_CLASS[string] + fret - rootPc + 120) % 12
  if (interval === 0) return 'root'
  if (interval === 3 || interval === 4) return 'third'
  if (interval === 7) return 'fifth'
  return 'note'
}

/**
 * Diagram window for a set of absolute frets: shapes that fit in the first four frets show the nut (start at 1);
 * anything higher starts at its lowest fretted note. (Matches chords-db's own `baseFret` for all 1,575 imported voicings.)
 */
export function windowStartFor(frets: readonly number[]): number {
  const fretted = frets.filter((f) => f > 0)
  if (fretted.length === 0 || Math.max(...fretted) <= 4) return 1
  return Math.min(...fretted)
}

/** One chord shape from absolute frets (low E first; -1 muted, 0 open) and optional per-string fingers. Shared by the local data and the API data. */
export function shapeFromFrets(
  frets: readonly number[],
  fingers: readonly number[] | null | undefined,
  root: RootName,
  id: string,
  label: string,
): FretShape {
  const rootPc = pitchClassOf(root)
  const positions: FretShape['positions'] = []
  const mutedStrings: StringNumber[] = []
  const openStrings: StringNumber[] = []
  frets.forEach((fret, i) => {
    const string = (i + 1) as StringNumber
    if (fret < 0) mutedStrings.push(string)
    else if (fret === 0) openStrings.push(string)
    else {
      const finger = fingers?.[i] ?? 0
      positions.push({
        string,
        fret,
        role: roleFor(string, fret, rootPc),
        ...(finger >= 1 && finger <= 4 ? { finger: finger as FingerNumber } : {}),
      })
    }
  })
  return { id, label, startFret: windowStartFor(frets), fretCount: 4, positions, mutedStrings, openStrings }
}

/** Parses the compact `"frets/fingers@baseFret"` form emitted by the generator (x = muted). */
function shapeFromRaw(raw: string, root: RootName, id: string, label: string): FretShape {
  const [body] = raw.split('@')
  const [fretText, fingerText] = body.split('/')
  const frets = fretText.split(',').map((f) => (f === 'x' ? -1 : Number(f)))
  const fingers = fingerText.split(',').map(Number)
  return shapeFromFrets(frets, fingers, root, id, label)
}

/** Every dataset voicing for a root + type (enharmonic roots like A# / Bb share one set), converted to diagram shapes. */
function datasetShapesFor(root: RootName, type: string, skip: Set<string>, numberFrom: number): FretShape[] {
  const key = CHORD_ROOT_TO_KEY[root]
  const entry = CHORD_VOICINGS_RAW.find(([k, quality]) => k === key && quality === type)
  if (!entry) return []
  const shapes: FretShape[] = []
  entry[2].forEach((raw, i) => {
    const shape = shapeFromRaw(raw, root, `${root}-${type}-db${i + 1}`, `Shape ${numberFrom + i}`)
    const signature = fretsOf(shape).join(',')
    if (skip.has(signature)) return
    skip.add(signature)
    shapes.push(shape)
  })
  return shapes
}

function libraryChord(root: RootName, type: ChordType, shapes: FretShape[]): LibraryChord {
  const typeLabel = CHORD_TYPE_LABELS[type]
  const name = `${root}${symbolFor(type)}`
  return {
    id: `${root.replace('#', 'sharp')}-t${TYPE_INDEX[type]}`,
    root,
    type,
    typeLabel,
    name,
    description: `${shapes.length} verified hand position${shapes.length === 1 ? '' : 's'} for ${name} (${typeLabel}).`,
    shapes,
  }
}

function buildLibrary(): LibraryChord[] {
  const chords: LibraryChord[] = []
  for (const root of ROOT_ORDER) {
    for (const type of TYPE_ORDER) {
      const authored = authoredShapesFor(root, type)
      const seen = new Set(authored.map((s) => fretsOf(s).join(',')))
      const shapes = [...authored, ...datasetShapesFor(root, type, seen, authored.length + 1)]
      if (shapes.length === 0) continue
      chords.push(libraryChord(root, type, shapes))
    }
  }
  return chords
}

/** A chord as the API serves it (see `services/api/types.ts`), reduced to what the library needs. */
export interface ChordVoicingRow {
  frets?: readonly number[] | null
  fingers?: readonly number[] | null
  label?: string | null
}

export interface ChordRow {
  root: string
  quality: string
  voicings: readonly ChordVoicingRow[]
}

/**
 * Builds the same `LibraryChord[]` the local data produces, from rows the API returns. Rows with an unknown root/quality or
 * without any voicing that has six fret values are dropped; labelled voicings (hand-authored ones) come first, the rest are
 * numbered "Shape N", identical frets are shown once.
 */
export function libraryFromRows(rows: readonly ChordRow[]): LibraryChord[] {
  const chords: LibraryChord[] = []
  for (const row of rows) {
    if (!isRootName(row.root) || !(row.quality in TYPE_INDEX)) continue
    const root = row.root
    const type = row.quality as ChordType
    const usable = row.voicings.filter((v) => v.frets?.length === 6)
    const ordered = [...usable.filter((v) => v.label), ...usable.filter((v) => !v.label)]

    const seen = new Set<string>()
    const shapes: FretShape[] = []
    ordered.forEach((v, i) => {
      const signature = v.frets!.join(',')
      if (seen.has(signature)) return
      seen.add(signature)
      const label = v.label ?? `Shape ${i + 1}`
      shapes.push(shapeFromFrets(v.frets!, v.fingers, root, `${root}-${type}-api${i + 1}`, label))
    })
    if (shapes.length > 0) chords.push(libraryChord(root, type, shapes))
  }
  return chords.sort((a, b) => ROOT_ORDER.indexOf(a.root) - ROOT_ORDER.indexOf(b.root) || TYPE_INDEX[a.type] - TYPE_INDEX[b.type])
}

export const CHORD_LIBRARY: LibraryChord[] = buildLibrary()

export interface ChordRootGroup {
  root: RootName
  chords: LibraryChord[]
}

/** Groups a library by root/tone (the top-level browsing unit — see `ChordLibraryGrid.tsx`), each root's chords ordered by `TYPE_ORDER`; roots without chords are hidden. */
export function groupByRoot(library: readonly LibraryChord[]): ChordRootGroup[] {
  return ROOT_ORDER.map((root) => ({
    root,
    chords: library.filter((c) => c.root === root).sort((a, b) => TYPE_INDEX[a.type] - TYPE_INDEX[b.type]),
  })).filter((group) => group.chords.length > 0)
}

export const CHORD_LIBRARY_BY_ROOT: ChordRootGroup[] = groupByRoot(CHORD_LIBRARY)

export function findLibraryChord(id: string): LibraryChord | undefined {
  return CHORD_LIBRARY.find((c) => c.id === id)
}

function isRootName(value: string): value is RootName {
  return (ROOT_ORDER as readonly string[]).includes(value)
}

/**
 * Parses shorthand chord names as they appear in the Song Lyrics dataset —
 * `"C"`, `"Am"`, `"F#"`, `"F#m"`, `"Bb"` — into a root + chord-type code,
 * matching the CSV's own spellings directly (naturals/sharps/flats are all
 * distinct entries there, so no enharmonic conversion is needed). A bare
 * root with no suffix resolves to `"maj"`; anything else (`"m"`, `"7"`,
 * `"m7"`, …) is passed straight through as the type code, so it only
 * resolves when that exact type exists in the dataset for that root.
 */
export function parseChordShorthand(raw: string): { root: RootName; type: string } | undefined {
  const trimmed = raw.trim()
  const match = /^([A-Ga-g])([#b]?)(.*)$/.exec(trimmed)
  if (!match) return undefined
  const [, letter, accidental, rest] = match
  const rootGuess = `${letter.toUpperCase()}${accidental}`
  if (!isRootName(rootGuess)) return undefined
  const type = rest === '' ? 'maj' : rest
  return { root: rootGuess, type }
}

/** Resolves a shorthand chord name (see `parseChordShorthand`) within `library`, when recognized. */
export function findChordByName(library: readonly LibraryChord[], name: string): LibraryChord | undefined {
  const parsed = parseChordShorthand(name)
  if (!parsed) return undefined
  return library.find((c) => c.root === parsed.root && c.type === parsed.type)
}

/** Same as `findChordByName`, against the local (built-in) library. */
export function findLibraryChordByName(name: string): LibraryChord | undefined {
  return findChordByName(CHORD_LIBRARY, name)
}

export { OPEN_STRING_PITCH_CLASS }
