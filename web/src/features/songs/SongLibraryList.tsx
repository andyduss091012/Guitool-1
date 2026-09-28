import { useMemo, useState } from 'react'
import type { Song, SongGenre, SongProgressEntry, SongStatus } from '../../types/song'
import { SONG_GENRES, SONG_STATUSES, SONG_STATUS_LABELS } from '../../types/song'
import { useLocale } from '../../hooks/useLocale'

export default function SongLibraryList({
  songs,
  getProgress,
  onSelect,
  onToggleFavorite,
}: {
  songs: Song[]
  getProgress: (id: string) => SongProgressEntry
  onSelect: (song: Song) => void
  onToggleFavorite: (id: string) => void
}) {
  const { t } = useLocale()
  const [genre, setGenre] = useState<SongGenre | 'all'>('all')
  const [status, setStatus] = useState<SongStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return songs.filter((s) => {
      const progress = getProgress(s.id)
      const matchesGenre = genre === 'all' || s.genre === genre
      const matchesStatus = status === 'all' || progress.status === status
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      return matchesGenre && matchesStatus && matchesQuery
    })
  }, [songs, genre, status, query, getProgress])

  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-full rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-sm text-parchment-100 placeholder:text-parchment-500/50 focus:border-ember-500 focus:outline-none"
        placeholder={t('songs.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {(['all', ...SONG_GENRES] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGenre(g)}
            className={
              genre === g
                ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                : 'chip !text-parchment-400/70 hover:!text-parchment-200'
            }
          >
            {g === 'all' ? t('songs.allGenres') : g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', ...SONG_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              status === s
                ? 'chip !border-brass-500/50 !bg-brass-500/15 !text-brass-300'
                : 'chip !text-parchment-400/70 hover:!text-parchment-200'
            }
          >
            {s === 'all' ? t('songs.allStatuses') : SONG_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <p className="text-xs text-parchment-400/60">{t('songs.songCount', { count: filtered.length })}</p>

      <div className="flex flex-col gap-2">
        {filtered.map((song) => {
          const progress = getProgress(song.id)
          return (
            <div key={song.id} className="panel flex items-center gap-3 px-4 py-3.5">
              <button type="button" onClick={() => onSelect(song)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display text-base font-medium tracking-wide text-parchment-100">
                    {song.title}
                  </p>
                  {song.isCustom && <span className="chip !py-0 !text-[10px]">{t('songs.customBadge')}</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-parchment-400/70">{song.artist}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="chip">{song.genre}</span>
                  <span className="chip !text-parchment-300">{SONG_STATUS_LABELS[progress.status]}</span>
                  <span className="text-xs text-parchment-400/60">
                    {t('songs.difficultyChip', { difficulty: song.difficulty })}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(song.id)}
                aria-pressed={progress.isFavorite}
                aria-label={progress.isFavorite ? t('songs.removeFromFavorites') : t('songs.addToFavorites')}
                className={
                  'shrink-0 text-xl transition hover:scale-110 ' +
                  (progress.isFavorite ? 'text-brass-400' : 'text-parchment-500/40')
                }
              >
                {progress.isFavorite ? '★' : '☆'}
              </button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="panel px-4 py-6 text-center text-sm text-parchment-400/70">{t('songs.noSongsMatch')}</p>
        )}
      </div>
    </div>
  )
}
