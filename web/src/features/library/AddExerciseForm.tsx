import { useMemo, useState, type FormEvent } from 'react'
import type { Exercise, ExerciseCategory, Rating1to5 } from '../../types/exercise'
import { EXERCISE_CATEGORY_LABELS } from '../../types/exercise'
import { validateCustomExerciseInput, type CustomExerciseInput } from '../../services/exerciseLibrary'
import { classifyByRatings, EXERCISE_TAG_STYLES } from '../../services/exerciseTags'
import { buildLookupLinks } from '../../services/webLookup'
import LookupOnlineLinks from './LookupOnlineLinks'
import { useLocale } from '../../hooks/useLocale'
import { CATEGORY_LABEL_KEYS } from '../../components/practice/CategoryBadge'
import { TAG_LABEL_KEYS } from '../../components/practice/ExerciseTagBadge'

const CATEGORY_VALUES = Object.keys(EXERCISE_CATEGORY_LABELS) as ExerciseCategory[]

interface FormState {
  name: string
  category: ExerciseCategory
  description: string
  difficulty: number
  importance: number
  usefulness: number
  recommendedDuration: string
  minDuration: string
  maxDuration: string
  skillTagsRaw: string
  instructionsRaw: string
  tipsRaw: string
  commonMistakesRaw: string
  bpmMin: string
  bpmMax: string
}

function blankForm(): FormState {
  return {
    name: '',
    category: 'technique',
    description: '',
    difficulty: 3,
    importance: 3,
    usefulness: 3,
    recommendedDuration: '15',
    minDuration: '10',
    maxDuration: '20',
    skillTagsRaw: '',
    instructionsRaw: '',
    tipsRaw: '',
    commonMistakesRaw: '',
    bpmMin: '',
    bpmMax: '',
  }
}

function exerciseToForm(exercise: Exercise): FormState {
  return {
    name: exercise.name,
    category: exercise.category,
    description: exercise.description,
    difficulty: exercise.difficulty,
    importance: exercise.importance,
    usefulness: exercise.usefulness,
    recommendedDuration: String(exercise.recommendedDuration),
    minDuration: String(exercise.minDuration),
    maxDuration: String(exercise.maxDuration),
    skillTagsRaw: exercise.skillTags.join(', '),
    instructionsRaw: exercise.instructions.join('\n'),
    tipsRaw: (exercise.tips ?? []).join('\n'),
    commonMistakesRaw: (exercise.commonMistakes ?? []).join('\n'),
    bpmMin: exercise.recommendedBpm ? String(exercise.recommendedBpm.min) : '',
    bpmMax: exercise.recommendedBpm ? String(exercise.recommendedBpm.max) : '',
  }
}

function formToInput(form: FormState): CustomExerciseInput {
  return {
    name: form.name,
    category: form.category,
    description: form.description,
    difficulty: form.difficulty,
    importance: form.importance,
    usefulness: form.usefulness,
    recommendedDuration: Number(form.recommendedDuration) || 0,
    minDuration: Number(form.minDuration) || 0,
    maxDuration: Number(form.maxDuration) || 0,
    skillTags: form.skillTagsRaw.split(',').map((s) => s.trim()).filter(Boolean),
    instructions: form.instructionsRaw.split('\n'),
    tips: form.tipsRaw.split('\n'),
    commonMistakes: form.commonMistakesRaw.split('\n'),
    bpmMin: form.bpmMin ? Number(form.bpmMin) : undefined,
    bpmMax: form.bpmMax ? Number(form.bpmMax) : undefined,
  }
}

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: Rating1to5) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-parchment-400/70">{label}</label>
        <span className="font-display text-sm text-brass-300">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Rating1to5)}
        className="w-full accent-ember-500"
      />
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-sm text-parchment-100 placeholder:text-parchment-500/50 focus:border-ember-500 focus:outline-none'

export default function AddExerciseForm({
  initial,
  onCancel,
  onSubmit,
  onDelete,
}: {
  initial?: Exercise
  onCancel: () => void
  onSubmit: (input: CustomExerciseInput) => void
  onDelete?: () => void
}) {
  const { t } = useLocale()
  const [form, setForm] = useState<FormState>(() => (initial ? exerciseToForm(initial) : blankForm()))
  const [errors, setErrors] = useState<string[]>([])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const input = useMemo(() => formToInput(form), [form])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validateCustomExerciseInput(input)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.exerciseNameLabel')}
          </label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('library.exerciseNamePlaceholder')}
            maxLength={80}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-parchment-400/70">{t('library.lookUpOnline')}</p>
          <LookupOnlineLinks links={buildLookupLinks(form.name)} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.categoryLabel')}
          </label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => update('category', e.target.value as ExerciseCategory)}
          >
            {CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>
                {t(CATEGORY_LABEL_KEYS[value])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.descriptionLabel')}
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder={t('library.descriptionPlaceholder')}
          />
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.autoTagPreview')}
          </p>
          <span className={`chip ${EXERCISE_TAG_STYLES[classifyByRatings(form.importance, form.difficulty)]}`}>
            {t(TAG_LABEL_KEYS[classifyByRatings(form.importance, form.difficulty)])}
          </span>
        </div>
        <p className="-mt-2 text-xs text-parchment-400/60">{t('library.autoTagExplain')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RatingSlider label={t('library.difficultyLabel')} value={form.difficulty} onChange={(v) => update('difficulty', v)} />
          <RatingSlider label={t('library.importanceLabel')} value={form.importance} onChange={(v) => update('importance', v)} />
          <RatingSlider label={t('library.usefulnessLabel')} value={form.usefulness} onChange={(v) => update('usefulness', v)} />
        </div>
      </section>

      <section className="panel grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.typicalMinutesLabel')}
          </label>
          <input
            type="number"
            min={5}
            className={inputClass}
            value={form.recommendedDuration}
            onChange={(e) => update('recommendedDuration', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.minMinutesLabel')}
          </label>
          <input
            type="number"
            min={5}
            className={inputClass}
            value={form.minDuration}
            onChange={(e) => update('minDuration', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.maxMinutesLabel')}
          </label>
          <input
            type="number"
            min={5}
            className={inputClass}
            value={form.maxDuration}
            onChange={(e) => update('maxDuration', e.target.value)}
          />
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.instructionsLabel')}
          </label>
          <textarea
            className={inputClass}
            rows={4}
            value={form.instructionsRaw}
            onChange={(e) => update('instructionsRaw', e.target.value)}
            placeholder={t('library.instructionsPlaceholder')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.tipsLabel')}
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.tipsRaw}
            onChange={(e) => update('tipsRaw', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.commonMistakesLabel')}
          </label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.commonMistakesRaw}
            onChange={(e) => update('commonMistakesRaw', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('library.skillTagsLabel')}
          </label>
          <input
            className={inputClass}
            value={form.skillTagsRaw}
            onChange={(e) => update('skillTagsRaw', e.target.value)}
            placeholder={t('library.skillTagsPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
              {t('library.bpmMinLabel')}
            </label>
            <input
              type="number"
              min={20}
              className={inputClass}
              value={form.bpmMin}
              onChange={(e) => update('bpmMin', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
              {t('library.bpmMaxLabel')}
            </label>
            <input
              type="number"
              min={20}
              className={inputClass}
              value={form.bpmMax}
              onChange={(e) => update('bpmMax', e.target.value)}
            />
          </div>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="rounded-xl border border-ember-600/50 bg-ember-500/10 px-4 py-3">
          <ul className="flex flex-col gap-1 text-sm text-ember-300">
            {errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          {initial ? t('library.saveChanges') : t('library.addToLibraryButton')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn-ghost ml-auto !text-ember-400"
            onClick={onDelete}
          >
            {t('library.deleteExercise')}
          </button>
        )}
      </div>
    </form>
  )
}
