import type { LocalizedText } from '../../i18n/localizedText'

/** Response shapes of the backend API (see the *Contracts.cs files in backend/src/GuitarApp.Application). Null fields are omitted by the server. */

export interface ApiPaged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
}

export interface ApiSong {
  id: string
  title: string
  artist: string
  artistSlug: string
  genre: string
  difficulty: number
  tuning?: string
  capo?: number
  keySignature?: string
  practiceNotes?: LocalizedText
  tags: string[]
}

export interface ApiChordVoicing {
  index: number
  /** Absolute frets, low E first; -1 muted, 0 open. */
  frets?: number[]
  /** Per string, same order; -1 muted, 0 open/unknown, 1-4 index…pinky. */
  fingers?: number[]
  baseFret?: number
  isPreferred: boolean
  label?: string
  fretsSource?: 'authored' | 'chords-db'
}

export interface ApiChord {
  id: string
  root: string
  quality: string
  label: string
  name: string
  voicings: ApiChordVoicing[]
}
