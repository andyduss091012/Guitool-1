import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '../../types/exercise'
import type { SessionExercise } from '../../types/session'
import { formatMinutesSeconds } from '../../utils/time'
import { playExerciseCompleteChime } from '../../utils/sound'
import ProgressBar from '../../components/ui/ProgressBar'
import CategoryBadge from '../../components/practice/CategoryBadge'
import ExerciseTagBadge from '../../components/practice/ExerciseTagBadge'
import FretboardDiagram from '../../components/practice/FretboardDiagram'
import MiniMusicTab from '../../components/practice/MiniMusicTab'
import { useLocale } from '../../hooks/useLocale'

const EXTRA_TIME_SECONDS = 5 * 60

interface ActiveExerciseProps {
  exercise: Exercise
  sessionExercise: SessionExercise
  exerciseNumber: number
  totalExercises: number
  nextExercise?: Exercise
  nextMinutes?: number
  onComplete: (finalElapsedSeconds: number) => void
  onSkip: (elapsedSeconds: number) => void
  onAddExtraTime: (seconds: number) => void
  onFlush: (elapsedSeconds: number) => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export default function ActiveExercise({
  exercise,
  sessionExercise,
  exerciseNumber,
  totalExercises,
  nextExercise,
  nextMinutes,
  onComplete,
  onSkip,
  onAddExtraTime,
  onFlush,
  isFavorite,
  onToggleFavorite,
}: ActiveExerciseProps) {
  const { t } = useLocale()
  const totalSeconds = sessionExercise.plannedSeconds + sessionExercise.extraSecondsAdded
  const [elapsed, setElapsed] = useState(sessionExercise.elapsedSeconds)
  const [paused, setPaused] = useState(false)
  const [showDetails, setShowDetails] = useState(true)

  const anchorRef = useRef({ time: Date.now(), base: sessionExercise.elapsedSeconds })
  const completedRef = useRef(false)
  const elapsedRef = useRef(elapsed)
  elapsedRef.current = elapsed

  useEffect(() => {
    if (paused || completedRef.current) return undefined
    anchorRef.current = { time: Date.now(), base: elapsedRef.current }
    const id = setInterval(() => {
      const deltaSec = Math.floor((Date.now() - anchorRef.current.time) / 1000)
      const next = Math.min(totalSeconds, anchorRef.current.base + deltaSec)
      setElapsed(next)
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, totalSeconds])

  useEffect(() => {
    if (!completedRef.current && totalSeconds > 0 && elapsed >= totalSeconds) {
      completedRef.current = true
      playExerciseCompleteChime()
      onComplete(totalSeconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, totalSeconds])

  // Safety net: persist progress if the user navigates away mid-exercise.
  useEffect(() => {
    return () => {
      if (!completedRef.current) onFlush(elapsedRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remaining = Math.max(0, totalSeconds - elapsed)
  const fraction = totalSeconds > 0 ? elapsed / totalSeconds : 0

  const handlePauseToggle = () => {
    setPaused((p) => {
      const next = !p
      if (next) onFlush(elapsedRef.current)
      return next
    })
  }

  const handleSkip = () => {
    completedRef.current = true
    onSkip(elapsedRef.current)
  }

  const handleAddTime = () => {
    onAddExtraTime(EXTRA_TIME_SECONDS)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">
          {t('practice.exerciseProgress', { current: exerciseNumber, total: totalExercises })}
        </p>
        <ProgressBar
          value={(exerciseNumber - 1 + fraction) / totalExercises}
          tone="brass"
          className="mt-2"
        />
      </div>

      <div className="panel-raised relative flex flex-col items-center gap-5 px-5 py-8 text-center">
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t('practice.removeFavorite') : t('practice.addFavorite')}
            className={
              'absolute right-4 top-4 text-xl transition hover:scale-110 ' +
              (isFavorite ? 'text-brass-400' : 'text-parchment-500/40')
            }
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CategoryBadge category={exercise.category} />
          <ExerciseTagBadge exercise={exercise} />
        </div>
        <h1 className="text-3xl font-semibold text-parchment-100 sm:text-4xl">{exercise.name}</h1>

        <div className="font-mono text-6xl font-semibold tabular-nums text-parchment-100 sm:text-7xl">
          {formatMinutesSeconds(remaining)}
        </div>
        <p className="-mt-3 text-xs uppercase tracking-widest2 text-parchment-400/60">{t('practice.remaining')}</p>

        <ProgressBar value={fraction} className="max-w-sm" />

        {exercise.recommendedBpm && (
          <p className="text-sm text-parchment-300">
            {t('practice.recommendedBpmLabel')}{' '}
            <span className="font-display font-semibold text-brass-300">
              {exercise.recommendedBpm.min}–{exercise.recommendedBpm.max}
            </span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="btn-secondary" onClick={handlePauseToggle}>
            {paused ? t('practice.resume') : t('practice.pause')}
          </button>
          <button className="btn-secondary" onClick={handleAddTime}>
            {t('practice.addFiveMin')}
          </button>
          <button className="btn-secondary" onClick={handleSkip}>
            {t('practice.skip')}
          </button>
        </div>
      </div>

      <section className="panel p-5">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowDetails((s) => !s)}
        >
          <h2 className="label-eyebrow">{t('practice.howToPractice')}</h2>
          <span className="text-parchment-400">{showDetails ? '−' : '+'}</span>
        </button>

        {showDetails && (
          <div className="mt-4 flex flex-col gap-5">
            <p className="text-sm text-parchment-300">{exercise.description}</p>

            {exercise.conceptIds && exercise.conceptIds.length > 0 ? (
              <div className="flex flex-col gap-3">
                {exercise.conceptIds.map((conceptId) => (
                  <MiniMusicTab key={conceptId} conceptId={conceptId} />
                ))}
              </div>
            ) : (
              exercise.diagram && (
                <div className="panel-raised flex flex-col gap-3 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-parchment-400/70">
                    {t('practice.fretPositions')}
                  </p>
                  <FretboardDiagram diagram={exercise.diagram} />
                </div>
              )
            )}

            <ol className="flex flex-col gap-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-parchment-200">
                  <span className="mt-0.5 shrink-0 font-display text-xs font-semibold text-brass-400">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-parchment-400/70">{t('practice.tips')}</p>
                <ul className="flex flex-col gap-1.5">
                  {exercise.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-parchment-300">
                      <span aria-hidden>💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-parchment-400/70">
                  {t('practice.watchOutFor')}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {exercise.commonMistakes.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-parchment-300">
                      <span aria-hidden>⚠️</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="panel flex items-center justify-between px-4 py-3">
        <span className="label-eyebrow">{t('practice.next')}</span>
        {nextExercise ? (
          <span className="text-sm text-parchment-200">
            {nextExercise.name} — {t('common.minutesAbbrev', { minutes: nextMinutes ?? 0 })}
          </span>
        ) : (
          <span className="text-sm text-parchment-400/70">{t('practice.lastExercise')}</span>
        )}
      </div>
    </div>
  )
}
