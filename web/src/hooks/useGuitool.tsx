import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PracticeSession, SessionExercise } from '../types/session'
import type { Exercise } from '../types/exercise'
import type { PlayerLevel } from '../types/progress'
import type { Song, SongProgressEntry, SongStatus } from '../types/song'
import { loadState, saveState, type GuitoolState } from '../storage/localStorage'
import { generateSession } from '../services/sessionGenerator'
import { recordSession, sessionMeaningfulSeconds } from '../services/progressService'
import { toggleFavorite as toggleFavoriteStat } from '../services/progressService'
import {
  buildLibrary,
  createCustomExercise,
  findExercise,
  type CustomExerciseInput,
} from '../services/exerciseLibrary'
import {
  buildSongLibrary,
  createCustomSong,
  findSong,
  type CustomSongInput,
} from '../services/songLibrary'
import { todayKey } from '../utils/date'
import { useBuiltInSongs } from './useBuiltInSongs'
import type { LoadStatus } from './useChordLibrary'

const DEFAULT_SONG_PROGRESS: SongProgressEntry = { status: 'want-to-learn', isFavorite: false }

interface GuitoolContextValue {
  state: GuitoolState
  today: string
  /** Built-in exercises plus everything the user has added themselves. */
  exercises: Exercise[]
  getExercise: (id: string) => Exercise | undefined
  /** Creates today's session if one doesn't exist yet (or `force` regenerates it). */
  ensureTodaySession: (force?: boolean) => void
  beginPractice: () => void
  updateExercise: (index: number, patch: Partial<SessionExercise>) => void
  setCurrentExerciseIndex: (index: number) => void
  finishSession: () => void
  toggleFavorite: (exerciseId: string) => void
  addCustomExercise: (input: CustomExerciseInput) => Exercise
  editCustomExercise: (id: string, input: CustomExerciseInput) => void
  removeCustomExercise: (id: string) => void
  /** Updates the user's self-reported skill level, which shapes future daily sessions. */
  setLevel: (level: PlayerLevel) => void
  /** Built-in songs plus everything the user has added themselves. */
  songs: Song[]
  /** Whether the built-in catalog is still loading from the API (always 'ready' in local mode). */
  songsStatus: LoadStatus
  songsError?: string
  reloadSongs: () => void
  getSong: (id: string) => Song | undefined
  /** This song's status/favorite, or the default ("want to learn", not favorited) if never touched. */
  getSongProgress: (id: string) => SongProgressEntry
  addCustomSong: (input: CustomSongInput) => Song
  editCustomSong: (id: string, input: CustomSongInput) => void
  removeCustomSong: (id: string) => void
  setSongStatus: (id: string, status: SongStatus) => void
  toggleSongFavorite: (id: string) => void
}

const GuitoolContext = createContext<GuitoolContextValue | null>(null)

export function GuitoolProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuitoolState>(() => loadState())
  const today = todayKey()

  useEffect(() => {
    saveState(state)
  }, [state])

  const exercises = useMemo(() => buildLibrary(state.customExercises), [state.customExercises])
  const exerciseIndex = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const getExercise = useCallback((id: string) => exerciseIndex.get(id), [exerciseIndex])

  const builtInSongs = useBuiltInSongs()
  const songs = useMemo(() => buildSongLibrary(state.customSongs, builtInSongs.songs), [state.customSongs, builtInSongs.songs])
  const songIndex = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs])
  const getSong = useCallback((id: string) => songIndex.get(id), [songIndex])
  const getSongProgress = useCallback(
    (id: string) => state.songProgress[id] ?? DEFAULT_SONG_PROGRESS,
    [state.songProgress],
  )

  // If a session exists from a previous day and was never finished, don't
  // silently carry it into today — today's dashboard should offer a fresh
  // "Generate Today's Practice" instead of yesterday's leftovers.
  useEffect(() => {
    setState((prev) => {
      if (prev.todaySession && prev.todaySession.date !== today && prev.todaySession.status !== 'completed') {
        return { ...prev, todaySession: undefined }
      }
      return prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const ensureTodaySession = useCallback(
    (force = false) => {
      setState((prev) => {
        const hasUsable = prev.todaySession && prev.todaySession.date === today
        if (hasUsable && !force) return prev
        const variationSeed = force ? Date.now() : 0
        const library = buildLibrary(prev.customExercises)
        const session = generateSession(library, prev.progress, prev.settings, { dateKey: today, variationSeed })
        return { ...prev, todaySession: session }
      })
    },
    [today],
  )

  const beginPractice = useCallback(() => {
    setState((prev) => {
      if (!prev.todaySession) return prev
      if (prev.todaySession.status === 'completed') return prev
      return {
        ...prev,
        todaySession: {
          ...prev.todaySession,
          status: 'in-progress',
          startedAt: prev.todaySession.startedAt ?? new Date().toISOString(),
        },
      }
    })
  }, [])

  const updateExercise = useCallback((index: number, patch: Partial<SessionExercise>) => {
    setState((prev) => {
      if (!prev.todaySession) return prev
      const exercises = prev.todaySession.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e))
      return { ...prev, todaySession: { ...prev.todaySession, exercises } }
    })
  }, [])

  const setCurrentExerciseIndex = useCallback((index: number) => {
    setState((prev) =>
      prev.todaySession ? { ...prev, todaySession: { ...prev.todaySession, currentExerciseIndex: index } } : prev,
    )
  }, [])

  const finishSession = useCallback(() => {
    setState((prev) => {
      if (!prev.todaySession) return prev
      const finished: PracticeSession = {
        ...prev.todaySession,
        status: 'completed',
        completedAt: new Date().toISOString(),
      }
      // Only fold it into progress once — guard against double-invocation.
      if (prev.todaySession.status === 'completed') return prev
      const progress = recordSession(prev.progress, finished)
      return { ...prev, progress, todaySession: finished }
    })
  }, [])

  const toggleFavorite = useCallback((exerciseId: string) => {
    setState((prev) => ({ ...prev, progress: toggleFavoriteStat(prev.progress, exerciseId) }))
  }, [])

  const addCustomExercise = useCallback((input: CustomExerciseInput) => {
    const exercise = createCustomExercise(input)
    setState((prev) => ({ ...prev, customExercises: [...prev.customExercises, exercise] }))
    return exercise
  }, [])

  const editCustomExercise = useCallback((id: string, input: CustomExerciseInput) => {
    setState((prev) => {
      const existing = findExercise(prev.customExercises, id)
      if (!existing) return prev
      const rebuilt = { ...createCustomExercise(input), id } // keep the original id
      return {
        ...prev,
        customExercises: prev.customExercises.map((e) => (e.id === id ? rebuilt : e)),
      }
    })
  }, [])

  const removeCustomExercise = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customExercises: prev.customExercises.filter((e) => e.id !== id),
    }))
  }, [])

  const setLevel = useCallback((level: PlayerLevel) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, level } }))
  }, [])

  const addCustomSong = useCallback((input: CustomSongInput) => {
    const song = createCustomSong(input)
    setState((prev) => ({ ...prev, customSongs: [...prev.customSongs, song] }))
    return song
  }, [])

  const editCustomSong = useCallback((id: string, input: CustomSongInput) => {
    setState((prev) => {
      const existing = findSong(prev.customSongs, id)
      if (!existing) return prev
      const rebuilt = { ...createCustomSong(input), id } // keep the original id
      return {
        ...prev,
        customSongs: prev.customSongs.map((s) => (s.id === id ? rebuilt : s)),
      }
    })
  }, [])

  const removeCustomSong = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customSongs: prev.customSongs.filter((s) => s.id !== id),
      songProgress: Object.fromEntries(Object.entries(prev.songProgress).filter(([songId]) => songId !== id)),
    }))
  }, [])

  const setSongStatus = useCallback((id: string, status: SongStatus) => {
    setState((prev) => {
      const existing = prev.songProgress[id] ?? DEFAULT_SONG_PROGRESS
      return { ...prev, songProgress: { ...prev.songProgress, [id]: { ...existing, status } } }
    })
  }, [])

  const toggleSongFavorite = useCallback((id: string) => {
    setState((prev) => {
      const existing = prev.songProgress[id] ?? DEFAULT_SONG_PROGRESS
      return {
        ...prev,
        songProgress: { ...prev.songProgress, [id]: { ...existing, isFavorite: !existing.isFavorite } },
      }
    })
  }, [])

  const value = useMemo<GuitoolContextValue>(
    () => ({
      state,
      today,
      exercises,
      getExercise,
      ensureTodaySession,
      beginPractice,
      updateExercise,
      setCurrentExerciseIndex,
      finishSession,
      toggleFavorite,
      addCustomExercise,
      editCustomExercise,
      removeCustomExercise,
      setLevel,
      songs,
      songsStatus: builtInSongs.status,
      songsError: builtInSongs.error,
      reloadSongs: builtInSongs.reload,
      getSong,
      getSongProgress,
      addCustomSong,
      editCustomSong,
      removeCustomSong,
      setSongStatus,
      toggleSongFavorite,
    }),
    [
      state,
      today,
      exercises,
      getExercise,
      ensureTodaySession,
      beginPractice,
      updateExercise,
      setCurrentExerciseIndex,
      finishSession,
      toggleFavorite,
      addCustomExercise,
      editCustomExercise,
      removeCustomExercise,
      setLevel,
      songs,
      builtInSongs.status,
      builtInSongs.error,
      builtInSongs.reload,
      getSong,
      getSongProgress,
      addCustomSong,
      editCustomSong,
      removeCustomSong,
      setSongStatus,
      toggleSongFavorite,
    ],
  )

  return <GuitoolContext.Provider value={value}>{children}</GuitoolContext.Provider>
}

export function useGuitool(): GuitoolContextValue {
  const ctx = useContext(GuitoolContext)
  if (!ctx) throw new Error('useGuitool must be used within a GuitoolProvider')
  return ctx
}

export { sessionMeaningfulSeconds }
