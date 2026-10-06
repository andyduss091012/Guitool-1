/**
 * Reusable music-theory content model.
 *
 * The old model (`Exercise.diagram` in `types/exercise.ts`) assumed one
 * exercise = one diagram, which breaks down fast: a scale has five
 * positions, not one, and "practice these open chords" is several distinct
 * chords, not a single shape. This model separates the *concept* (a chord,
 * a scale, an arpeggio, a technique) from the *exercise* that practices it:
 * a concept can hold as many shapes/positions as the real instrument has,
 * and an `Exercise` (see `types/exercise.ts`) references one or more
 * concepts by id via `conceptIds` instead of embedding a single diagram.
 *
 * No database yet — concepts live in typed TS modules under
 * `src/data/concepts/`, the same approach already used for exercises and
 * songs, so content mistakes are still caught by the manual TypeScript
 * check rather than only discovered at runtime.
 */

import type { LocalizableText } from '../i18n/localizedText'

export type FingerNumber = 1 | 2 | 3 | 4
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6

/** What a fretted note *is* within the chord/scale, independent of how it's fingered. */
export type FretPositionRole = 'root' | 'third' | 'fifth' | 'note' | 'other'

export interface FretPosition {
  /** 1 = low E (6th string, thickest) … 6 = high e (1st string, thinnest). */
  string: StringNumber
  /** Fret number, counted from the nut (open string = 0). */
  fret: number
  /** What this note is functionally — drives the diagram's dot color. */
  role?: FretPositionRole
  /** Suggested fretting-hand finger (1 = index … 4 = pinky). Omitted where fingering genuinely varies (e.g. some barre-chord shapes). */
  finger?: FingerNumber
  /**
   * Scale-degree label relative to the concept's root, e.g. '1', 'b3', '5',
   * 'b7' for a pentatonic minor shape. Optional, and mainly meant for scale/
   * arpeggio shapes — chord shapes can derive an equivalent label from
   * `role` directly ('root' → '1', 'third' → '3', 'fifth' → '5') without
   * needing this field duplicated.
   */
  interval?: string
}

/**
 * One playable shape/voicing of a chord, or one position of a scale/
 * arpeggio. Reused across chord and scale concepts rather than having two
 * near-identical types, since both are just "a set of fretted notes plus
 * some strings you don't play."
 */
export interface FretShape {
  id: string
  /** Short label for this shape, e.g. "Open", "E-shape (barre)", "Position 1". */
  label: string
  /** First fret shown on the diagram. 1 means the diagram includes the nut. */
  startFret: number
  /** How many frets wide the diagram is. */
  fretCount: number
  positions: FretPosition[]
  /**
   * Strings not played at all in this shape, shown with a "×" above the
   * nut. Hand-authored shapes only list this when startFret is 1; shapes
   * from the chord dataset list it at any position.
   */
  mutedStrings?: StringNumber[]
  /**
   * Strings played open (shown as "O" above the grid). When omitted, the
   * diagram derives them for shapes that start at the nut (every string
   * with no note and not muted). Dataset shapes higher up the neck can still
   * have open strings (e.g. an open G string over a barre at fret 6), so
   * they list them explicitly.
   */
  openStrings?: StringNumber[]
  /** Short note shown under the diagram, e.g. a fingering caveat. */
  caption?: LocalizableText
}

interface MusicConceptBase {
  id: string
  /** Musical/technical name (e.g. "E major (open)") — left untranslated by convention, but typed as `LocalizableText` for uniformity with the other content fields. */
  name: LocalizableText
  /** Alternate names this concept is commonly known by (search/lookup aid). */
  aliases?: string[]
  /** One or two sentence summary of what this concept is and where it's used. */
  description: LocalizableText
}

export type ChordCategory = 'open' | 'barre' | 'power' | 'seventh' | 'extended' | 'other'

export interface ChordConcept extends MusicConceptBase {
  type: 'chord'
  category: ChordCategory
  shapes: FretShape[]
}

export interface ScaleConcept extends MusicConceptBase {
  type: 'scale'
  /** e.g. "pentatonic", "diatonic", "blues", "modal". */
  family: string
  shapes: FretShape[]
}

export interface ArpeggioConcept extends MusicConceptBase {
  type: 'arpeggio'
  /** e.g. "triad", "seventh". */
  family: string
  shapes: FretShape[]
}

export type TechniqueSubtype = 'technique' | 'lick'

export interface TechniqueConcept extends MusicConceptBase {
  type: 'technique'
  subtype: TechniqueSubtype
  /** General how-to steps — independent of any one exercise that practices it. */
  steps?: string[]
  /**
   * Techniques and licks aren't always shape-based (e.g. "alternate
   * picking" isn't a fret pattern), so this is optional — but when there's
   * a concrete example fretting (a specific lick, a technique demonstrated
   * on a scale fragment), it's shown the same way a chord/scale shape is.
   */
  shapes?: FretShape[]
}

export type MusicConcept = ChordConcept | ScaleConcept | ArpeggioConcept | TechniqueConcept
