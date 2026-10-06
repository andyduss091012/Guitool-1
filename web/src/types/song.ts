import type { Rating1to5 } from './exercise'
import type { LocalizableText } from '../i18n/localizedText'

/**
 * A song in Guitool's own catalog — metadata and original practice notes
 * only. There is deliberately no field for tab/chord-chart notation or
 * lyrics: that content is copyrighted (by Songsterr, Ultimate Guitar, the
 * original publisher, etc.) and this app doesn't scrape, store, or
 * reproduce it. `services/webLookup.ts` builds search links out to those
 * sites instead — see `buildSongLookupLinks`.
 */

export const SONG_GENRES = [
  'Rock',
  'Pop',
  'Folk',
  'Blues',
  'Metal',
  'Reggae',
  'Classical / Fingerstyle',
  'Country',
  'Other',
] as const

export type SongGenre = (typeof SONG_GENRES)[number]

export type SongStatus = 'want-to-learn' | 'learning' | 'learned'

export const SONG_STATUSES: SongStatus[] = ['want-to-learn', 'learning', 'learned']

export const SONG_STATUS_LABELS: Record<SongStatus, string> = {
  'want-to-learn': 'Want to Learn',
  learning: 'Learning',
  learned: 'Learned',
}

export interface Song {
  id: string
  title: string
  artist: string
  genre: SongGenre
  difficulty: Rating1to5

  /** e.g. "Standard (EADGBE)", "Drop D", "Half-step down (Eb standard)". */
  tuning: string
  /** Fret the capo commonly sits at, only set when it's unambiguous/well-established; omit otherwise. */
  capo?: number
  /** Key signature, only set when it's unambiguous/well-established. */
  keySignature?: string

  /**
   * What to focus on technique-wise — written in our own words, never
   * copied tab/chord notation or lyrics.
   */
  practiceNotes: LocalizableText

  /** Free-form tags for search — technique, decade, mood, etc. */
  tags: string[]

  /**
   * True for songs the user added themselves (stored in localStorage, not
   * in the built-in catalog file). Built-in songs leave this unset. Only
   * custom songs can be edited or deleted from the Songs page.
   */
  isCustom?: boolean
}

/** Per-song, per-user progress: where you're at with it, and whether it's a favorite. Keyed by song id. */
export interface SongProgressEntry {
  status: SongStatus
  isFavorite: boolean
}
