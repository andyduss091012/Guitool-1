import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGuitool } from '../hooks/useGuitool'
import StatTile from '../components/ui/StatTile'
import WeekBarChart from '../features/progress/WeekBarChart'
import {
  favoriteExercises,
  last7DaysMinutes,
  mostPracticedExercise,
  needsAttention,
  thisMonthSeconds,
  thisWeekSeconds,
} from '../services/progressStats'
import { formatHoursMinutes } from '../utils/time'
import { useLocale } from '../hooks/useLocale'

export default function Progress() {
  const { state, exercises } = useGuitool()
  const { t } = useLocale()
  const { progress } = state

  const weekMinutes = useMemo(() => formatHoursMinutes(thisWeekSeconds(progress)), [progress])
  const monthMinutes = useMemo(() => formatHoursMinutes(thisMonthSeconds(progress)), [progress])
  const days = useMemo(() => last7DaysMinutes(progress), [progress])
  const topExercise = useMemo(() => mostPracticedExercise(exercises, progress), [exercises, progress])
  const attention = useMemo(() => needsAttention(exercises, progress), [exercises, progress])
  const favorites = useMemo(() => favoriteExercises(exercises, progress), [exercises, progress])

  const hasAnyHistory = progress.sessionHistory.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">{t('nav.progress')}</p>
        <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{t('progress.headline')}</h1>
      </div>

      <section className="panel-raised flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            🔥
          </span>
          <p className="font-display text-2xl font-semibold text-brass-300">
            {t('progress.currentStreakDays', { count: progress.streak.current })}
          </p>
        </div>
        <p className="text-xs text-parchment-400/70">
          {t('progress.longestStreakLabel', { count: progress.streak.longest })}
        </p>
      </section>

      {!hasAnyHistory ? (
        <p className="panel px-4 py-6 text-center text-sm text-parchment-400/70">{t('progress.emptyState')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label={t('common.thisWeek')} value={weekMinutes} />
            <StatTile label={t('common.thisMonth')} value={monthMinutes} />
            <StatTile label={t('common.sessions')} value={String(progress.totalSessionsCompleted)} />
            <StatTile label={t('common.totalTime')} value={formatHoursMinutes(progress.totalPracticeSeconds)} />
          </div>

          <section className="panel p-5">
            <h2 className="label-eyebrow mb-4">{t('progress.last7Days')}</h2>
            <WeekBarChart days={days} />
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="panel px-4 py-4">
              <p className="label-eyebrow mb-2">{t('progress.mostPracticed')}</p>
              {topExercise ? (
                <>
                  <p className="font-display text-lg text-parchment-100">{topExercise.exercise.name}</p>
                  <p className="text-xs text-parchment-400/70">
                    {formatHoursMinutes(topExercise.totalSeconds)} ·{' '}
                    {t('progress.sessionsCount', { count: topExercise.timesPracticed })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-parchment-400/70">{t('progress.notEnoughData')}</p>
              )}
            </section>

            <section className="panel px-4 py-4">
              <p className="label-eyebrow mb-2">{t('progress.needsAttention')}</p>
              {attention ? (
                <>
                  <p className="font-display text-lg text-parchment-100">{attention.exercise.name}</p>
                  <p className="text-xs text-parchment-400/70">
                    {t('progress.practicedTimesSoFar', { count: attention.timesPracticed })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-parchment-400/70">{t('progress.nothingFlagged')}</p>
              )}
            </section>
          </div>

          {favorites.length > 0 && (
            <section className="panel px-4 py-4">
              <p className="label-eyebrow mb-2">{t('progress.favorites')}</p>
              <div className="flex flex-wrap gap-2">
                {favorites.map((ex) => (
                  <span key={ex.id} className="chip gap-1">
                    <span aria-hidden>★</span>
                    {ex.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Link to="/library" className="btn-ghost self-start">
        📚 {t('progress.manageLibrary')}
      </Link>
    </div>
  )
}
