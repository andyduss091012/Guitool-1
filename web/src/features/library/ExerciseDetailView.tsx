import type { Exercise } from '../../types/exercise'
import { buildLookupLinks } from '../../services/webLookup'
import CategoryBadge from '../../components/practice/CategoryBadge'
import ExerciseTagBadge from '../../components/practice/ExerciseTagBadge'
import FretboardDiagram from '../../components/practice/FretboardDiagram'
import MiniMusicTab from '../../components/practice/MiniMusicTab'
import LookupOnlineLinks from './LookupOnlineLinks'
import { useLocale } from '../../hooks/useLocale'

export default function ExerciseDetailView({
  exercise,
  onBack,
  onDuplicate,
}: {
  exercise: Exercise
  onBack: () => void
  onDuplicate: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-6">
      <button className="btn-ghost self-start" onClick={onBack}>
        {t('library.backToLibrary')}
      </button>

      <section className="panel-raised flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={exercise.category} />
          <ExerciseTagBadge exercise={exercise} />
        </div>
        <h1 className="text-2xl font-semibold text-parchment-100">{exercise.name}</h1>
        <p className="text-sm text-parchment-300">{exercise.description}</p>

        <div className="flex flex-wrap gap-2 text-xs text-parchment-400/70">
          <span className="chip">{t('library.difficultyValue', { value: exercise.difficulty })}</span>
          <span className="chip">{t('library.importanceValue', { value: exercise.importance })}</span>
          <span className="chip">{t('library.usefulnessValue', { value: exercise.usefulness })}</span>
          <span className="chip">{t('common.minutesAbbrev', { minutes: exercise.recommendedDuration })}</span>
          {exercise.recommendedBpm && (
            <span className="chip">
              {t('library.bpmRange', { min: exercise.recommendedBpm.min, max: exercise.recommendedBpm.max })}
            </span>
          )}
        </div>

        {exercise.conceptIds && exercise.conceptIds.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-parchment-400/70">
              {exercise.conceptIds.length > 1 ? t('library.shapesMultiple') : t('library.shapesSingle')}
            </p>
            {exercise.conceptIds.map((conceptId) => (
              <MiniMusicTab key={conceptId} conceptId={conceptId} />
            ))}
          </div>
        ) : (
          exercise.diagram && (
            <div className="panel flex flex-col gap-3 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-parchment-400/70">{t('practice.fretPositions')}</p>
              <FretboardDiagram diagram={exercise.diagram} />
            </div>
          )
        )}

        <ol className="flex flex-col gap-2">
          {exercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-parchment-200">
              <span className="mt-0.5 shrink-0 font-display text-xs font-semibold text-brass-400">{i + 1}</span>
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

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-parchment-400/70">
            {t('library.readMoreAboutIt')}
          </p>
          <LookupOnlineLinks links={buildLookupLinks(exercise.name)} />
        </div>
      </section>

      <div className="panel flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-parchment-300">{t('library.builtInNotice')}</p>
        <button className="btn-secondary shrink-0" onClick={onDuplicate}>
          {t('library.duplicateAndCustomize')}
        </button>
      </div>
    </div>
  )
}
