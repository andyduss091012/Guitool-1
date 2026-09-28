import type { ExerciseCategory } from '../../types/exercise'
import { useLocale } from '../../hooks/useLocale'
import type { TranslationKey } from '../../i18n/translations'

const CATEGORY_ICON: Record<ExerciseCategory, string> = {
  technique: '🤘',
  scales: '🪜',
  rhythm: '🥁',
  chords: '🎼',
  fretboard: '🗺️',
  improvisation: '💭',
  song: '🎶',
}

/** Fixed display label per category value — static UI copy, not exercise data. */
export const CATEGORY_LABEL_KEYS: Record<ExerciseCategory, TranslationKey> = {
  technique: 'practice.category.technique',
  scales: 'practice.category.scales',
  rhythm: 'practice.category.rhythm',
  chords: 'practice.category.chords',
  fretboard: 'practice.category.fretboard',
  improvisation: 'practice.category.improvisation',
  song: 'practice.category.song',
}

export default function CategoryBadge({ category }: { category: ExerciseCategory }) {
  const { t } = useLocale()
  return (
    <span className="chip gap-1">
      <span aria-hidden>{CATEGORY_ICON[category]}</span>
      {t(CATEGORY_LABEL_KEYS[category])}
    </span>
  )
}
