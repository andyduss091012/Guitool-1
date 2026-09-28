import { useState } from 'react'
import type { MusicConcept } from '../../types/musicConcept'
import FretShapeDiagram from './FretShapeDiagram'
import { useLocale } from '../../hooks/useLocale'

/**
 * Shows one `MusicConcept` (see `types/musicConcept.ts`) and lets the user
 * page through *all* of its shapes — the whole reason the content model
 * exists: a scale has five positions, CAGED gives a chord five shapes, and
 * an exercise built on the old one-diagram-per-exercise assumption could
 * never show that. Chords/arpeggios/techniques with just one shape still
 * render fine here; the shape picker only appears once there's more than
 * one to pick from.
 */
export default function ConceptShapeBrowser({ concept }: { concept: MusicConcept }) {
  const { t } = useLocale()
  const shapes = concept.shapes ?? []
  const [index, setIndex] = useState(0)
  const active = shapes[Math.min(index, shapes.length - 1)]

  if (shapes.length === 0) {
    return (
      <div className="panel flex flex-col gap-2 px-4 py-4">
        <ConceptHeader concept={concept} />
        <p className="text-xs text-parchment-400/60">{t('practice.noDiagramYet')}</p>
      </div>
    )
  }

  const mode = concept.type === 'chord' ? 'chord' : 'scale'

  return (
    <div className="panel flex flex-col gap-3 px-4 py-4">
      <ConceptHeader concept={concept} />

      {shapes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {shapes.map((shape, i) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setIndex(i)}
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

      <FretShapeDiagram shape={active} mode={mode} />

      {shapes.length > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="btn-ghost"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            {t('practice.previousShape')}
          </button>
          <span className="text-xs text-parchment-400/60">
            {index + 1} / {shapes.length}
          </span>
          <button
            type="button"
            className="btn-ghost"
            disabled={index === shapes.length - 1}
            onClick={() => setIndex((i) => Math.min(shapes.length - 1, i + 1))}
          >
            {t('practice.nextShape')}
          </button>
        </div>
      )}
    </div>
  )
}

function ConceptHeader({ concept }: { concept: MusicConcept }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-sm font-medium tracking-wide text-parchment-100">{concept.name}</p>
        <p className="text-xs text-parchment-400/70">{concept.description}</p>
      </div>
    </div>
  )
}
