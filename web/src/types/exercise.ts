/**
 * Core data model for a practice exercise.
 *
 * Duration model: `recommendedDuration` is the "typical" baseline the
 * exercise is written for (used for display / defaults). `minDuration` and
 * `maxDuration` give the session generator room to compress or stretch the
 * exercise depending on the day's time budget, without ever handing out an
 * unreasonably short or long slot.
 */

import type { LocalizableText } from '../i18n/localizedText'

export type ExerciseCategory =
  | 'technique'
  | 'scales'
  | 'rhythm'
  | 'chords'
  | 'fretboard'
  | 'improvisation'
  | 'song'

export type Rating1to5 = 1 | 2 | 3 | 4 | 5

export interface BpmRange {
  min: number
  max: number
}

export type FingerNumber = 1 | 2 | 3 | 4
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6

export interface FretboardNote {
  /** 1 = low E (6th string, thickest) ... 6 = high e (1st string, thinnest). */
  string: StringNumber
  /** Fret number, counted from the nut (open string = 0). */
  fret: number
  /** Which fretting-hand finger plays this note (1 = index … 4 = pinky). Omit for an open string. */
  finger?: FingerNumber
  /** Highlights this note as the scale's root / chord's tonic. */
  root?: boolean
}

export interface FretboardDiagram {
  /**
   * 'scale' draws a horizontal box-pattern view (strings as rows, frets as
   * columns) — the usual way scale shapes are diagrammed. 'chord' draws the
   * familiar vertical chord-chart view (strings as columns, frets as rows).
   */
  mode: 'scale' | 'chord'
  /** First fret shown on the diagram. 1 means the diagram starts at the nut. */
  startFret: number
  /** How many frets wide/tall the diagram is. */
  fretCount: number
  notes: FretboardNote[]
  /**
   * Chord mode only: strings that shouldn't be played at all, shown with a
   * "×" above the diagram — used for a string this shape simply skips (e.g.
   * a movable power-chord shape's higher strings), not just literal open-
   * position muting. Open-string "O" markers are inferred automatically
   * (any string with no note and not listed here, when startFret is 1).
   * Ignored in scale mode.
   */
  mutedStrings?: StringNumber[]
  /** Short caption shown under the diagram, e.g. "Movable shape — root shown is A". */
  caption?: string
}

export interface Exercise {
  id: string
  /** Musical/technical name (e.g. "Alternate Picking Fundamentals") — left untranslated by convention, but typed as `LocalizableText` for uniformity with the other content fields. */
  name: LocalizableText
  category: ExerciseCategory
  /** One or two sentence summary of what the exercise is and why it matters. */
  description: LocalizableText

  difficulty: Rating1to5
  importance: Rating1to5
  usefulness: Rating1to5

  /** Typical minutes this exercise is written for. */
  recommendedDuration: number
  /** Shortest useful slot the generator may assign, in minutes. */
  minDuration: number
  /** Longest sensible slot the generator may assign, in minutes. */
  maxDuration: number

  /** Free-form tags used for weak-area matching and future filtering/search. */
  skillTags: string[]

  /** Ordered, actionable steps to follow during the exercise. */
  instructions: LocalizableText[]

  tips?: LocalizableText[]
  commonMistakes?: LocalizableText[]
  recommendedBpm?: BpmRange

  /**
   * Legacy single fret-position diagram (see
   * `components/practice/FretboardDiagram.tsx`). Still used by exercises not
   * yet migrated to the concept model below — new content should prefer
   * `conceptIds` instead, since a diagram here can only ever show one shape.
   */
  diagram?: FretboardDiagram

  /**
   * References into the reusable music-concept content model
   * (`types/musicConcept.ts`, `data/concepts/`). Unlike `diagram`, a
   * concept can carry as many shapes/positions as the instrument actually
   * has (all 5 pentatonic positions, all 5 CAGED shapes, every open chord
   * a "chord changes" exercise cycles through) — this is how an exercise
   * exposes a complete concept rather than a single static picture.
   */
  conceptIds?: string[]

  /**
   * True for exercises the user added themselves (stored in localStorage,
   * not in the built-in library file). Built-in exercises leave this unset.
   * Only custom exercises can be edited or deleted from the Library page.
   */
  isCustom?: boolean
}

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  technique: 'Technique',
  scales: 'Scales',
  rhythm: 'Rhythm',
  chords: 'Chords',
  fretboard: 'Fretboard',
  improvisation: 'Improvisation',
  song: 'Song Practice',
}
