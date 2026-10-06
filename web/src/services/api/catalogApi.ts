import type { Song, SongGenre } from '../../types/song'
import { SONG_GENRES } from '../../types/song'
import type { Rating1to5 } from '../../types/exercise'
import { apiGet } from './client'
import type { ApiChord, ApiPaged, ApiSong } from './types'

/** The whole chord library (every chord that has at least one voicing with real frets) in one request. */
export function fetchChordLibraryRows(signal?: AbortSignal): Promise<ApiChord[]> {
  return apiGet<ApiChord[]>('/api/chords/library', signal)
}

const PAGE_SIZE = 100

/** Every built-in song, fetched page by page (the API caps a page at 100). */
export async function fetchSongs(signal?: AbortSignal): Promise<Song[]> {
  const songs: Song[] = []
  for (let page = 1; ; page++) {
    const result = await apiGet<ApiPaged<ApiSong>>(`/api/songs?page=${page}&pageSize=${PAGE_SIZE}`, signal)
    songs.push(...result.items.map(toSong))
    if (!result.hasNextPage) return songs
  }
}

function toGenre(value: string): SongGenre {
  return (SONG_GENRES as readonly string[]).includes(value) ? (value as SongGenre) : 'Other'
}

/** API song -> the shape the rest of the app already uses (`id` is the same slug as the local data). */
export function toSong(api: ApiSong): Song {
  return {
    id: api.id,
    title: api.title,
    artist: api.artist,
    genre: toGenre(api.genre),
    difficulty: Math.min(5, Math.max(1, Math.round(api.difficulty))) as Rating1to5,
    tuning: api.tuning ?? 'Standard (EADGBE)',
    capo: api.capo,
    keySignature: api.keySignature,
    practiceNotes: api.practiceNotes ?? '',
    tags: api.tags,
  }
}
