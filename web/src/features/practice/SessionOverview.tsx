import type { PracticeSession } from '../../types/session'
import type { Exercise } from '../../types/exercise'
import ExercisePreviewCard from '../../components/practice/ExercisePreviewCard'
import { useLocale } from '../../hooks/useLocale'

export default function SessionOverview({
  session,
  getExercise,
  onStart,
}: {
  session: PracticeSession
  getExercise: (id: string) => Exercise | undefined
  onStart: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">{t('practice.todaysPractice')}</p>
        <h1 className="mt-1 text-3xl font-semibold text-parchment-100">
          {t('practice.totalMinutes', { minutes: session.totalPlannedMinutes })}
        </h1>
      </div>

      <div className="flex flex-col gap-2">
        {session.exercises.map((se, i) => {
          const exercise = getExercise(se.exerciseId)
          if (!exercise) return null
          return (
            <ExercisePreviewCard
              key={se.exerciseId}
              index={i}
              exercise={exercise}
              minutes={Math.round(se.plannedSeconds / 60)}
            />
          )
        })}
      </div>

      <div className="panel flex items-center justify-between px-4 py-3">
        <span className="label-eyebrow">{t('practice.total')}</span>
        <span className="font-display text-lg text-parchment-100">{session.totalPlannedMinutes}:00</span>
      </div>

      <button className="btn-primary" onClick={onStart}>
        {t('practice.startPractice')}
      </button>
    </div>
  )
}
