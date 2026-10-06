import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { MusicConcept } from '../../types/musicConcept'
import { useShapeIndex } from '../../hooks/useShapeIndex'
import { useLocale } from '../../hooks/useLocale'
import FretShapeDiagram, { shapeLabel, type DiagramLabelMode } from './FretShapeDiagram'
import type { TranslationKey } from '../../i18n/translations'

const LABEL_MODES: { mode: DiagramLabelMode; labelKey: TranslationKey }[] = [
  { mode: 'finger', labelKey: 'shapeViewer.fingers' },
  { mode: 'note', labelKey: 'shapeViewer.notes' },
  { mode: 'interval', labelKey: 'shapeViewer.intervals' },
]

const SWIPE_THRESHOLD_PX = 45

/**
 * Full-screen (mobile, below `md`) / centered-modal (desktop, `md` and up)
 * viewer for every shape of one `MusicConcept`. Built from scratch — there
 * was no modal/dialog/drawer component anywhere in the app to reuse (see
 * the Part 2 inspection report) — using only plain React state, native
 * touch events and CSS transitions, per the "no new state or animation
 * library" constraint.
 *
 * Deliberately stateless about *which* shape is "current" beyond its own
 * lifetime: `initialIndex` seeds it from wherever `MiniMusicTab` was
 * showing, and `onIndexChange` reports navigation back up so closing and
 * reopening the viewer resumes where you left off. Neither this component
 * nor `MiniMusicTab` lifts that state into `ActiveExercise` or any shared
 * store, so opening/closing it during a practice session can't interfere
 * with `ActiveExercise`'s own timer state.
 */
export default function ShapeViewer({
  concept,
  initialIndex,
  onIndexChange,
  onClose,
}: {
  concept: MusicConcept
  initialIndex: number
  onIndexChange?: (index: number) => void
  onClose: () => void
}) {
  const { t, l } = useLocale()
  const shapes = concept.shapes ?? []
  const { index, setIndex, next, prev, hasNext, hasPrev } = useShapeIndex(shapes.length, initialIndex)
  const active = shapes[index]
  const mode = concept.type === 'chord' ? 'chord' : 'scale'
  const conceptName = l(concept.name)

  const [labelMode, setLabelMode] = useState<DiagramLabelMode>('finger')
  const [visible, setVisible] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    onIndexChange?.(index)
    // Only meant to fire when the shape actually changes, not on every
    // render — `onIndexChange` (a setState setter from the parent) is
    // stable across renders so omitting it here is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Mount-in transition (fade + slide up) and initial focus for the
  // dialog. A rAF tick so the "from" state paints before we animate to
  // "visible" — an immediate class flip wouldn't transition at all.
  useEffect(() => {
    dialogRef.current?.focus()
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
        return
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, onClose])

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const deltaX = endX - touchStartX.current
    touchStartX.current = null
    if (deltaX > SWIPE_THRESHOLD_PX) prev()
    else if (deltaX < -SWIPE_THRESHOLD_PX) next()
  }

  if (!active) return null

  return (
    <div
      className={
        'fixed inset-0 z-40 flex items-end justify-center bg-ink-950/70 backdrop-blur-sm ' +
        'transition-opacity duration-200 motion-reduce:transition-none md:items-center ' +
        (visible ? 'opacity-100' : 'opacity-0')
      }
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('shapeViewer.dialogLabel', { name: conceptName })}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={
          'panel-raised flex max-h-[90vh] w-full flex-col gap-4 overflow-y-auto rounded-b-none rounded-t-2xl p-5 outline-none ' +
          'transition-transform duration-200 motion-reduce:transition-none md:max-w-lg md:rounded-2xl ' +
          (visible ? 'translate-y-0' : 'translate-y-6 md:translate-y-0')
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-parchment-100">{conceptName}</p>
            <p className="text-xs text-parchment-400/70">{l(concept.description)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('shapeViewer.closeLabel', { name: conceptName })}
            className="btn-ghost shrink-0 !p-2 text-lg leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
          >
            ✕
          </button>
        </div>

        {shapes.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('shapeViewer.shapesGroupLabel', { name: conceptName })}>
            {shapes.map((shape, i) => (
              <button
                key={shape.id}
                type="button"
                aria-pressed={i === index}
                aria-label={t('shapeViewer.showShapeLabel', { current: i + 1, total: shapes.length, label: shapeLabel(shape.label, t) })}
                onClick={() => setIndex(i)}
                className={
                  (i === index
                    ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                    : 'chip !text-parchment-400/70 hover:!text-parchment-200') +
                  ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400'
                }
              >
                {shapeLabel(shape.label, t)}
              </button>
            ))}
          </div>
        )}

        <div key={active.id} className="flex justify-center motion-safe:animate-[shape-fade-in_180ms_ease-out]">
          <FretShapeDiagram shape={active} mode={mode} labelMode={labelMode} />
        </div>

        <div className="flex items-center justify-center gap-1.5" role="group" aria-label={t('shapeViewer.noteLabelStyle')}>
          {LABEL_MODES.map(({ mode: m, labelKey }) => {
            const label = t(labelKey)
            return (
              <button
                key={m}
                type="button"
                onClick={() => setLabelMode(m)}
                aria-pressed={labelMode === m}
                aria-label={t('shapeViewer.showOnDiagram', { label: label.toLowerCase() })}
                className={
                  (m === labelMode
                    ? 'chip !border-brass-500/60 !bg-brass-500/15 !text-brass-300'
                    : 'chip !text-parchment-400/70 hover:!text-parchment-200') +
                  ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400'
                }
              >
                {label}
              </button>
            )
          })}
        </div>

        {active.caption && <p className="text-center text-xs text-parchment-400/70">{l(active.caption)}</p>}

        {shapes.length > 1 && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="btn-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
              disabled={!hasPrev}
              onClick={prev}
              aria-label={t('shapeViewer.previousShapeLabel')}
            >
              {t('shapeViewer.previous')}
            </button>
            <span className="text-xs text-parchment-400/60" aria-live="polite">
              {t('shapeViewer.shapeCounter', { current: index + 1, total: shapes.length })}
            </span>
            <button
              type="button"
              className="btn-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
              disabled={!hasNext}
              onClick={next}
              aria-label={t('shapeViewer.nextShapeLabel')}
            >
              {t('shapeViewer.next')}
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-parchment-400/50 md:hidden">{t('shapeViewer.swipeHint')}</p>
      </div>
    </div>
  )
}
