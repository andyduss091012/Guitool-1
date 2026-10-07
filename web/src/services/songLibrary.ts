import { SONGS } from '../data/songs'
import type { Rating1to5 } from '../types/exercise'
import type { Song, SongGenre } from '../types/song'
import { generateId } from '../utils/id'

/** Built-in songs (from the local data or the API, see `hooks/useBuiltInSongs.ts`) plus the user's own. */
export function buildSongLibrary(customSongs: Song[], builtIn: Song[] = SONGS): Song[] {
  return [...builtIn, ...customSongs]
}

export function findSong(library: Song[], id: string): Song | undefined {
  return library.find((s) => s.id === id)
}

export interface CustomSongInput {
  title: string
  artist: string
  genre: SongGenre
  difficulty: number
  tuning: string
  capo?: number
  keySignature?: string
  practiceNotes: string
  tags: string[]
}

function clampRating(n: number): Rating1to5 {
  return Math.min(5, Math.max(1, Math.round(n))) as Rating1to5
}

export function createCustomSong(input: CustomSongInput): Song {
  return {
    id: generateId('song'),
    title: input.title.trim(),
    artist: input.artist.trim(),
    genre: input.genre,
    difficulty: clampRating(input.difficulty),
    tuning: input.tuning.trim() || 'Standard (EADGBE)',
    capo: input.capo && input.capo > 0 ? Math.round(input.capo) : undefined,
    keySignature: input.keySignature?.trim() || undefined,
    practiceNotes: input.practiceNotes.trim(),
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    isCustom: true,
  }
}

export function validateCustomSongInput(input: CustomSongInput): string[] {
  const errors: string[] = []
  if (!input.title.trim()) errors.push('Give the song a title.')
  if (!input.artist.trim()) errors.push('Add the artist.')
  if (!input.tuning.trim()) errors.push('Add a tuning (e.g. "Standard (EADGBE)").')
  return errors
}
