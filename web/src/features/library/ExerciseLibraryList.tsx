import { useMemo, useState } from 'react'
import type { Exercise, ExerciseCategory } from '../../types/exercise'
import CategoryBadge, { CATEGORY_LABEL_KEYS } from '../../components/practice/CategoryBadge'
import ExerciseTagBadge from '../../components/practice/ExerciseTagBadge'
import { useLocale } from '../../hooks/useLocale'

const CATEGORY_FILTERS: (ExerciseCategory | 'all')[] = [
  'all',
  'technique',
  'scales',
  'rhythm',
  'chords',
  'fretboard',
  'improvisation',
  'song',
]

export default function ExerciseLibraryList({
  exercises,
  onEdit,
}: {
  exercises: Exercise[]
  onEdit: (exercise: Exercise) => void
}) {
  const { t, l } = useLocale()
  const [category, setCategory] = useState<ExerciseCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      const matchesCategory = category === 'all' || e.category === category
      const matchesQuery = !q || l(e.name).toLowerCase().includes(q) || e.skillTags.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesQuery
    })
  }, [exercises, category, query, l])

  return (
    <div className="flex flex-col gap-4">
      <input
        className="w-full rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-sm text-parchment-100 placeholder:text-parchment-500/50 focus:border-ember-500 focus:outline-none"
        placeholder={t('library.searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={
              category === c
                ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                : 'chip !text-parchment-400/70 hover:!text-parchment-200'
            }
          >
            {c === 'all' ? t('library.allCategories') : t(CATEGORY_LABEL_KEYS[c])}
          </button>
        ))}
      </div>

      <p className="text-xs text-parchment-400/60">
        {filtered.length === 1
          ? t('library.exerciseCountOne', { count: filtered.length })
          : t('library.exerciseCountOther', { count: filtered.length })}
      </p>

      <div className="flex flex-col gap-2">
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            onClick={() => onEdit(exercise)}
            className="panel flex items-center gap-4 px-4 py-3.5 text-left transition hover:bg-ink-700/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-display text-base font-medium tracking-wide text-parchment-100">
                  {l(exercise.name)}
                </p>
                {exercise.isCustom && <span className="chip !py-0 !text-[10px]">{t('library.customBadge')}</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CategoryBadge category={exercise.category} />
                <ExerciseTagBadge exercise={exercise} />
                <span className="text-xs text-parchment-400/60">
                  {t('library.durationDifficulty', { minutes: exercise.recommendedDuration, difficulty: exercise.difficulty })}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-parchment-400/50">
              {exercise.isCustom ? t('library.editArrow') : t('library.viewArrow')}
            </span>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="panel px-4 py-6 text-center text-sm text-parchment-400/70">
            {t('library.noExercisesMatch')}
          </p>
        )}
      </div>
    </div>
  )
}
