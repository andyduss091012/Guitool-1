import { useCallback, useEffect, useState } from 'react'
import { SONGS } from '../data/songs'
import { fetchSongs } from '../services/api/catalogApi'
import { DATA_SOURCE } from '../services/dataSource'
import type { Song } from '../types/song'
import type { LoadStatus } from './useChordLibrary'

export interface BuiltInSongsState {
  songs: Song[]
  status: LoadStatus
  error?: string
  reload: () => void
}

let apiSongs: Promise<Song[]> | null = null

function loadApiSongs(): Promise<Song[]> {
  if (!apiSongs) {
    const request = fetchSongs()
    request.catch(() => {
      if (apiSongs === request) apiSongs = null
    })
    apiSongs = request
  }
  return apiSongs
}

interface RemoteState {
  status: LoadStatus
  songs: Song[]
  error?: string
}

/** The built-in song catalog from the configured data source (see `services/dataSource.ts`). User-added songs are merged in by `buildSongLibrary`. */
export function useBuiltInSongs(): BuiltInSongsState {
  const [attempt, setAttempt] = useState(0)
  const [remote, setRemote] = useState<RemoteState>({ status: 'loading', songs: [] })

  useEffect(() => {
    if (DATA_SOURCE !== 'api') return
    let cancelled = false
    setRemote((previous) => (previous.status === 'ready' ? previous : { status: 'loading', songs: [] }))
    loadApiSongs().then(
      (songs) => {
        if (!cancelled) setRemote({ status: 'ready', songs })
      },
      (error: unknown) => {
        if (!cancelled) setRemote({ status: 'error', songs: [], error: error instanceof Error ? error.message : String(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    apiSongs = null
    setAttempt((n) => n + 1)
  }, [])

  if (DATA_SOURCE !== 'api') return { songs: SONGS, status: 'ready', reload }
  return { songs: remote.songs, status: remote.status, error: remote.error, reload }
}
