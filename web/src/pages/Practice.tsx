import { useNavigate } from 'react-router-dom'
import { useGuitool } from '../hooks/useGuitool'
import SessionOverview from '../features/practice/SessionOverview'
import ActiveExercise from '../features/practice/ActiveExercise'
import SessionSummary from '../features/practice/SessionSummary'
import { playSessionCompleteChime } from '../utils/sound'
import { useLocale } from '../hooks/useLocale'

export default function Practice() {
  const { t } = useLocale()
  const { state, getExercise, beginPractice, updateExercise, setCurrentExerciseIndex, finishSession, toggleFavorite } =
    useGuitool()
  const navigate = useNavigate()
  const session = state.todaySession

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-parchment-300">{t('practice.noSessionYet')}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          {t('practice.goToDashboard')}
        </button>
      </div>
    )
  }

  if (session.status === 'planned') {
    return <SessionOverview session={session} getExercise={getExercise} onStart={beginPractice} />
  }

  if (session.status === 'completed') {
    return <SessionSummary session={session} getExercise={getExercise} onDone={() => navigate('/')} />
  }

  const idx = Math.min(session.currentExerciseIndex, session.exercises.length - 1)
  const se = session.exercises[idx]
  const exercise = getExercise(se.exerciseId)
  const nextSe = session.exercises[idx + 1]
  const nextExercise = nextSe ? getExercise(nextSe.exerciseId) : undefined

  if (!exercise) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-parchment-300">{t('practice.exerciseNotFound')}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          {t('practice.goToDashboard')}
        </button>
      </div>
    )
  }

  const advance = () => {
    if (idx + 1 < session.exercises.length) {
      setCurrentExerciseIndex(idx + 1)
    } else {
      finishSession()
      playSessionCompleteChime()
    }
  }

  return (
    <ActiveExercise
      key={idx}
      exercise={exercise}
      sessionExercise={se}
      exerciseNumber={idx + 1}
      totalExercises={session.exercises.length}
      nextExercise={nextExercise}
      nextMinutes={nextSe ? Math.round((nextSe.plannedSeconds + nextSe.extraSecondsAdded) / 60) : undefined}
      onFlush={(elapsedSeconds) => updateExercise(idx, { elapsedSeconds })}
      onComplete={(elapsedSeconds) => {
        updateExercise(idx, { elapsedSeconds, completed: true })
        advance()
      }}
      onSkip={(elapsedSeconds) => {
        updateExercise(idx, { elapsedSeconds, skipped: true, completed: false })
        advance()
      }}
      onAddExtraTime={(seconds) => updateExercise(idx, { extraSecondsAdded: se.extraSecondsAdded + seconds })}
      isFavorite={state.progress.exerciseStats[exercise.id]?.isFavorite ?? false}
      onToggleFavorite={() => toggleFavorite(exercise.id)}
    />
  )
}
