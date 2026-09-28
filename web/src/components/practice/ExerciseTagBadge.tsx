import { classifyExercise, EXERCISE_TAG_STYLES, type ExerciseTag } from '../../services/exerciseTags'
import type { Exercise } from '../../types/exercise'
import { useLocale } from '../../hooks/useLocale'
import type { TranslationKey } from '../../i18n/translations'

/** Fixed display label per tag value — static UI copy, not exercise data. */
export const TAG_LABEL_KEYS: Record<ExerciseTag, TranslationKey> = {
  'must-learn': 'practice.tag.mustLearn',
  easy: 'practice.tag.easy',
  medium: 'practice.tag.medium',
  hard: 'practice.tag.hard',
}

/** Small chip showing an exercise's auto-derived priority/difficulty tag (Must Learn / Easy / Medium / Hard). */
export default function ExerciseTagBadge({ exercise }: { exercise: Exercise }) {
  const { t } = useLocale()
  const tag = classifyExercise(exercise)
  return <span className={`chip ${EXERCISE_TAG_STYLES[tag]}`}>{t(TAG_LABEL_KEYS[tag])}</span>
}
