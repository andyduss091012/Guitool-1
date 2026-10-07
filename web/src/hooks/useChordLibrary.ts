import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CHORD_LIBRARY,
  CHORD_LIBRARY_BY_ROOT,
  findChordByName,
  groupByRoot,
  libraryFromRows,
  type ChordRootGroup,
  type LibraryChord,
} from '../data/chordLibrary'
import { fetchChordLibraryRows } from '../services/api/catalogApi'
import { DATA_SOURCE } from '../services/dataSource'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface ChordLibraryState {
  library: readonly LibraryChord[]
  byRoot: ChordRootGroup[]
  status: LoadStatus
  error?: string
  /** Retries after a failed API load (no-op in local mode). */
  reload: () => void
  /** Resolves a chord symbol such as "Am7" or "F#" against this library. */
  find: (name: string) => LibraryChord | undefined
}

// One shared request: the chord browser and the lyrics view both use the hook, but the API is only called once.
let apiLibrary: Promise<LibraryChord[]> | null = null

function loadApiLibrary(): Promise<LibraryChord[]> {
  if (!apiLibrary) {
    const request = fetchChordLibraryRows().then(libraryFromRows)
    request.catch(() => {
      if (apiLibrary === request) apiLibrary = null // let the next attempt retry
    })
    apiLibrary = request
  }
  return apiLibrary
}

interface RemoteState {
  status: LoadStatus
  library: LibraryChord[]
  error?: string
}

/**
 * The chord library from the configured data source (`VITE_DATA_SOURCE`, see `services/dataSource.ts`):
 * the built-in modules (instant) or the API (loading → ready | error).
 */
export function useChordLibrary(): ChordLibraryState {
  const [attempt, setAttempt] = useState(0)
  const [remote, setRemote] = useState<RemoteState>({ status: 'loading', library: [] })

  useEffect(() => {
    if (DATA_SOURCE !== 'api') return
    let cancelled = false
    setRemote((previous) => (previous.status === 'ready' ? previous : { status: 'loading', library: [] }))
    loadApiLibrary().then(
      (library) => {
        if (!cancelled) setRemote({ status: 'ready', library })
      },
      (error: unknown) => {
        if (!cancelled) setRemote({ status: 'error', library: [], error: error instanceof Error ? error.message : String(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    apiLibrary = null
    setAttempt((n) => n + 1)
  }, [])

  const library = DATA_SOURCE === 'api' ? remote.library : CHORD_LIBRARY
  const byRoot = useMemo(() => (DATA_SOURCE === 'api' ? groupByRoot(remote.library) : CHORD_LIBRARY_BY_ROOT), [remote.library])
  const find = useCallback((name: string) => findChordByName(library, name), [library])

  return {
    library,
    byRoot,
    status: DATA_SOURCE === 'api' ? remote.status : 'ready',
    error: remote.error,
    reload,
    find,
  }
}
