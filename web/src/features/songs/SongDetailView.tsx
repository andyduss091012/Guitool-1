import type { Song, SongProgressEntry, SongStatus } from '../../types/song'
import { SONG_STATUSES, SONG_STATUS_LABELS } from '../../types/song'
import { buildSongLookupLinks } from '../../services/webLookup'
import LookupOnlineLinks from '../library/LookupOnlineLinks'
import { useLocale } from '../../hooks/useLocale'

export default function SongDetailView({
  song,
  progress,
  onBack,
  onSetStatus,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  song: Song
  progress: SongProgressEntry
  onBack: () => void
  onSetStatus: (status: SongStatus) => void
  onToggleFavorite: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-6">
      <button className="btn-ghost self-start" onClick={onBack}>
        {t('songs.backToSongs')}
      </button>

      <section className="panel-raised flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{song.genre}</span>
            {song.isCustom && <span className="chip !py-0 !text-[10px]">{t('songs.customBadge')}</span>}
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={progress.isFavorite}
            aria-label={progress.isFavorite ? t('songs.removeFromFavorites') : t('songs.addToFavorites')}
            className={
              'shrink-0 text-2xl transition hover:scale-110 ' +
              (progress.isFavorite ? 'text-brass-400' : 'text-parchment-500/40')
            }
          >
            {progress.isFavorite ? '★' : '☆'}
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-parchment-100">{song.title}</h1>
          <p className="text-sm text-parchment-400/70">{song.artist}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-parchment-400/70">
          <span className="chip">{t('songs.difficultyChip', { difficulty: song.difficulty })}</span>
          <span className="chip">{song.tuning}</span>
          {song.capo !== undefined && <span className="chip">{t('songs.capoChip', { capo: song.capo })}</span>}
          {song.keySignature && <span className="chip">{t('songs.keyChip', { key: song.keySignature })}</span>}
        </div>

        {song.practiceNotes && <p className="text-sm text-parchment-300">{song.practiceNotes}</p>}

        {song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {song.tags.map((tag) => (
              <span key={tag} className="text-xs text-parchment-400/50">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="panel flex flex-col gap-3 p-5">
        <p className="label-eyebrow">{t('songs.yourStatus')}</p>
        <div className="flex flex-wrap gap-2">
          {SONG_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onSetStatus(status)}
              className={
                progress.status === status
                  ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                  : 'chip !text-parchment-400/70 hover:!text-parchment-200'
              }
            >
              {SONG_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel flex flex-col gap-3 p-5">
        <p className="label-eyebrow">{t('songs.getTabChords')}</p>
        <LookupOnlineLinks links={buildSongLookupLinks(song.title, song.artist)} />
      </section>

      <div className="panel flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        {song.isCustom ? (
          <>
            <p className="text-sm text-parchment-300">{t('songs.ownSongNotice')}</p>
            <div className="flex gap-2">
              {onEdit && (
                <button className="btn-secondary shrink-0" onClick={onEdit}>
                  {t('songs.edit')}
                </button>
              )}
              {onDelete && (
                <button className="btn-ghost shrink-0 !text-ember-400" onClick={onDelete}>
                  {t('common.delete')}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-parchment-300">{t('songs.builtInNotice')}</p>
            {onDuplicate && (
              <button className="btn-secondary shrink-0" onClick={onDuplicate}>
                {t('songs.duplicateAndCustomize')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
