import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuitool } from '../hooks/useGuitool'
import { PLAYER_LEVEL_LABELS } from '../types/progress'
import { greetingForHour, startOfWeekKey } from '../utils/date'
import { formatHoursMinutes } from '../utils/time'
import { thisWeekSeconds } from '../services/progressStats'
import StatTile from '../components/ui/StatTile'
import ExercisePreviewCard from '../components/practice/ExercisePreviewCard'
import { useLocale } from '../hooks/useLocale'

export default function Dashboard() {
  const { state, exercises, getExercise, ensureTodaySession, beginPractice, today } = useGuitool()
  const { t } = useLocale()
  const navigate = useNavigate()
  const { progress } = state
  const session = state.todaySession

  useEffect(() => {
    ensureTodaySession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const weekMinutes = useMemo(() => formatHoursMinutes(thisWeekSeconds(progress)), [progress])
  const weekSessions = useMemo(
    () => progress.sessionHistory.filter((s) => s.date >= startOfWeekKey()).length,
    [progress],
  )

  const continueLearning = useMemo(() => {
    if (session) {
      return session.exercises.map((e) => getExercise(e.exerciseId)).filter(Boolean)
    }
    return [...exercises].sort((a, b) => b.importance - a.importance).slice(0, 3)
  }, [session, exercises, getExercise])

  const handleStart = () => {
    beginPractice()
    navigate('/practice')
  }

  const handleGenerate = () => ensureTodaySession(true)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">{greetingForHour()}</p>
        <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{t('dashboard.readyToPlay')}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {progress.streak.current > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-brass-600/40 bg-brass-500/10 px-4 py-2">
            <span className="text-lg" aria-hidden>
              🔥
            </span>
            <span className="font-display text-sm font-semibold uppercase tracking-wide text-brass-300">
              {t('dashboard.streakDays', { count: progress.streak.current })}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/level')}
          className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800/60 px-4 py-2 text-xs uppercase tracking-wide text-parchment-300/80 transition hover:bg-ink-700/60"
        >
          <span aria-hidden>🎚️</span>
          {t('dashboard.levelBadge', { level: PLAYER_LEVEL_LABELS[state.settings.level] })}
        </button>
      </div>

      {/* Today's Practice */}
      <section className="panel-raised flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="label-eyebrow">{t('dashboard.todaysPractice')}</h2>
          {session && session.status !== 'completed' && (
            <button className="btn-ghost" onClick={handleGenerate}>
              🔄 {t('dashboard.regenerate')}
            </button>
          )}
        </div>

        {session ? (
          <>
            <p className="font-display text-2xl font-semibold text-parchment-100">
              {t('dashboard.plannedMinutes', { minutes: session.totalPlannedMinutes })}
            </p>
            <div className="flex flex-col gap-2">
              {session.exercises.map((se, i) => {
                const exercise = getExercise(se.exerciseId)
                if (!exercise) return null
                return (
                  <ExercisePreviewCard
                    key={se.exerciseId}
                    index={i}
                    exercise={exercise}
                    minutes={Math.round((se.plannedSeconds + se.extraSecondsAdded) / 60)}
                    done={se.completed}
                    skipped={se.skipped}
                  />
                )
              })}
            </div>

            {session.status === 'completed' ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-brass-600/30 bg-brass-500/10 px-4 py-3">
                <p className="font-display text-sm font-semibold text-brass-300">
                  {t('dashboard.sessionCompleteMessage')}
                </p>
                <button className="btn-secondary" onClick={handleGenerate}>
                  {t('dashboard.practiceMoreToday')}
                </button>
              </div>
            ) : (
              <button className="btn-primary w-full sm:w-auto" onClick={handleStart}>
                ▶ {session.status === 'in-progress' ? t('dashboard.continuePractice') : t('dashboard.startPractice')}
              </button>
            )}
          </>
        ) : (
          <button className="btn-primary w-full sm:w-auto" onClick={handleGenerate}>
            {t('dashboard.generateTodaysPractice')}
          </button>
        )}
      </section>

      {/* Quick tools */}
      <section>
        <h2 className="label-eyebrow mb-3">{t('dashboard.quickTools')}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:w-[44rem]">
          <button className="panel flex flex-col items-center gap-1.5 py-4" onClick={() => navigate('/tuner')}>
            <span className="text-2xl" aria-hidden>
              🎵
            </span>
            <span className="font-display text-sm uppercase tracking-wide text-parchment-200">{t('nav.tuner')}</span>
          </button>
          <button className="panel flex flex-col items-center gap-1.5 py-4" onClick={() => navigate('/metronome')}>
            <span className="text-2xl" aria-hidden>
              🥁
            </span>
            <span className="font-display text-sm uppercase tracking-wide text-parchment-200">
              {t('nav.metronome')}
            </span>
          </button>
          <button className="panel flex flex-col items-center gap-1.5 py-4" onClick={() => navigate('/library')}>
            <span className="text-2xl" aria-hidden>
              📚
            </span>
            <span className="font-display text-sm uppercase tracking-wide text-parchment-200">
              {t('nav.library')}
            </span>
          </button>
          <button className="panel flex flex-col items-center gap-1.5 py-4" onClick={() => navigate('/songs')}>
            <span className="text-2xl" aria-hidden>
              📜
            </span>
            <span className="font-display text-sm uppercase tracking-wide text-parchment-200">{t('nav.songs')}</span>
          </button>
          <button className="panel flex flex-col items-center gap-1.5 py-4" onClick={() => navigate('/my-tabs')}>
            <span className="text-2xl" aria-hidden>
              🗂️
            </span>
            <span className="font-display text-sm uppercase tracking-wide text-parchment-200">
              {t('dashboard.myTabsLabel')}
            </span>
          </button>
        </div>
      </section>

      {/* Progress snapshot */}
      <section>
        <h2 className="label-eyebrow mb-3">{t('nav.progress')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <StatTile label={t('common.thisWeek')} value={weekMinutes} />
          <StatTile label={t('common.sessions')} value={String(weekSessions)} />
        </div>
      </section>

      {/* Continue learning */}
      {continueLearning.length > 0 && (
        <section>
          <h2 className="label-eyebrow mb-3">
            {session ? t('dashboard.inTodaysSession') : t('dashboard.suggestedForYou')}
          </h2>
          <div className="flex flex-col gap-2">
            {continueLearning.map(
              (exercise, i) =>
                exercise && (
                  <ExercisePreviewCard
                    key={exercise.id}
                    index={i}
                    exercise={exercise}
                    minutes={exercise.recommendedDuration}
                  />
                ),
            )}
          </div>
        </section>
      )}
    </div>
  )
}
