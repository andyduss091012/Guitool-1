import { useState } from 'react'
import { getConcept } from '../../data/concepts'
import { useShapeIndex } from '../../hooks/useShapeIndex'
import { useLocale } from '../../hooks/useLocale'
import FretShapeDiagram from './FretShapeDiagram'
import ShapeViewer from './ShapeViewer'

/**
 * Compact preview card for one music concept (a chord, scale, or arpeggio),
 * looked up entirely from `conceptId` — no fret data is ever passed in or
 * duplicated here, matching the "no hardcoded shapes in UI components" rule
 * the concept-model system was built around. Shows the concept's default
 * shape at a glance, lets you flip between shapes with the small chip row,
 * and opens the full `ShapeViewer` for a closer look.
 *
 * This is the direct replacement for the old always-expanded
 * `ConceptShapeBrowser` in `ExerciseDetailView` / `ActiveExercise` — see
 * those files and the README's Part 2 notes. `ConceptShapeBrowser.tsx`
 * itself is left in place, unused, rather than deleted (this project can't
 * delete files from the linked machine; same as the other orphaned
 * placeholder components already in the repo).
 */
export default function MiniMusicTab({ conceptId }: { conceptId: string }) {
  const { t } = useLocale()
  const concept = getConcept(conceptId)
  const shapes = concept?.shapes ?? []
  const { index, setIndex } = useShapeIndex(shapes.length)
  const [viewerOpen, setViewerOpen] = useState(false)

  if (!concept) return null

  if (shapes.length === 0) {
    return (
      <div className="panel flex flex-col gap-2 px-4 py-4">
        <ConceptHeader name={concept.name} description={concept.description} />
        <p className="text-xs text-parchment-400/60">{t('miniMusicTab.noDiagram')}</p>
      </div>
    )
  }

  const active = shapes[index]
  const mode = concept.type === 'chord' ? 'chord' : 'scale'

  return (
    <div className="panel flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <ConceptHeader name={concept.name} description={concept.description} />
        {shapes.length > 1 && <span className="chip shrink-0">{t('miniMusicTab.shapesCount', { count: shapes.length })}</span>}
      </div>

      {shapes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {shapes.map((shape, i) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('miniMusicTab.showShapeLabel', { label: shape.label, name: concept.name })}
              aria-pressed={i === index}
              className={
                i === index
                  ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                  : 'chip !text-parchment-400/70 hover:!text-parchment-200'
              }
            >
              {shape.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        className="group flex flex-col items-center gap-2 rounded-xl py-1 transition hover:bg-ink-700/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
        aria-label={
          shapes.length > 1
            ? t('miniMusicTab.openViewerWithCount', { name: concept.name, count: shapes.length })
            : t('miniMusicTab.openViewer', { name: concept.name })
        }
      >
        <FretShapeDiagram shape={active} mode={mode} />
        <span className="text-xs font-medium uppercase tracking-wide text-brass-400 group-hover:text-brass-300">
          {t('miniMusicTab.viewAllShapes')}
        </span>
      </button>

      {viewerOpen && (
        <ShapeViewer concept={concept} initialIndex={index} onIndexChange={setIndex} onClose={() => setViewerOpen(false)} />
      )}
    </div>
  )
}

function ConceptHeader({ name, description }: { name: string; description: string }) {
  return (
    <div>
      <p className="font-display text-sm font-medium tracking-wide text-parchment-100">{name}</p>
      <p className="text-xs text-parchment-400/70">{description}</p>
    </div>
  )
}
