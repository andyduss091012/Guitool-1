import type { Exercise } from '../../types/exercise'
import CategoryBadge from './CategoryBadge'
import ExerciseTagBadge from './ExerciseTagBadge'
import { useLocale } from '../../hooks/useLocale'

interface ExercisePreviewCardProps {
  index: number
  exercise: Exercise
  minutes: number
  done?: boolean
  skipped?: boolean
  active?: boolean
  onClick?: () => void
}

export default function ExercisePreviewCard({
  index,
  exercise,
  minutes,
  done,
  skipped,
  active,
  onClick,
}: ExercisePreviewCardProps) {
  const { t, l } = useLocale()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        'panel flex w-full items-center gap-4 px-4 py-3.5 text-left transition',
        active ? 'ring-1 ring-ember-500/60' : '',
        onClick ? 'hover:bg-ink-700/50' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold',
          done ? 'bg-brass-500/20 text-brass-300' : 'bg-ink-700 text-parchment-300',
        ].join(' ')}
      >
        {done ? '✓' : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-medium tracking-wide text-parchment-100">
          {l(exercise.name)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <CategoryBadge category={exercise.category} />
          <ExerciseTagBadge exercise={exercise} />
          {skipped && <span className="text-xs text-parchment-400/60">{t('practice.skipped')}</span>}
        </div>
      </div>
      <span className="shrink-0 font-display text-sm tabular-nums text-parchment-300">
        {t('common.minutesAbbrev', { minutes })}
      </span>
    </button>
  )
}
