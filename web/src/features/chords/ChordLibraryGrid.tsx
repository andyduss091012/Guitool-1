import { useState } from 'react'
import type { ChordConcept } from '../../types/musicConcept'
import type { LibraryChord } from '../../data/chordLibrary'
import DataStatus from '../../components/DataStatus'
import { useChordLibrary } from '../../hooks/useChordLibrary'
import ShapeViewer from '../../components/practice/ShapeViewer'
import { useLocale } from '../../hooks/useLocale'

function toConcept(chord: LibraryChord): ChordConcept {
  return {
    id: chord.id,
    type: 'chord',
    category: 'other',
    name: chord.name,
    description: chord.description,
    shapes: chord.shapes,
  }
}

/**
 * "All kinds of chords on guitar with many hand positions" — sourced from
 * the `chord-fingers.csv` dataset (see `data/chordLibrary.ts`), browsed by
 * root/tone first rather than by major/minor: pick a root (A, A#, Bb, B, …)
 * to see every chord type the dataset has for it (major, minor, 7, m7,
 * 9(#11), dim7, and so on), then a chord type to page through its hand
 * positions in the existing `ShapeViewer`.
 */
export default function ChordLibraryGrid() {
  const { t } = useLocale()
  const { byRoot, status, error, reload } = useChordLibrary()
  const [openRoot, setOpenRoot] = useState<string | null>(null)
  const [openChordId, setOpenChordId] = useState<string | null>(null)

  const rootGroup = openRoot ? byRoot.find((g) => g.root === openRoot) : undefined
  const openChord = openChordId ? rootGroup?.chords.find((c) => c.id === openChordId) : undefined

  if (!rootGroup) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brass-500">
          {t('songsChords.chooseARoot')}
        </h2>
        <DataStatus status={status} error={error} onRetry={reload} />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {byRoot.map((group) => (
            <button
              key={group.root}
              type="button"
              onClick={() => setOpenRoot(group.root)}
              className="panel flex flex-col items-center gap-1 px-2 py-3 text-center transition hover:bg-ink-700/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
              aria-label={t('songsChords.viewChordsFor', { root: group.root })}
            >
              <span className="font-display text-lg font-semibold text-parchment-100">{group.root}</span>
              <span className="text-[10px] text-parchment-400/60">
                {t('songsChords.chordCount', { count: group.chords.length })}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-brass-500">
          {t('songsChords.rootChordsHeading', { root: rootGroup.root })}
        </h2>
        <button type="button" className="btn-ghost" onClick={() => setOpenRoot(null)}>
          {t('songsChords.allRoots')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {rootGroup.chords.map((chord) => (
          <button
            key={chord.id}
            type="button"
            onClick={() => setOpenChordId(chord.id)}
            className="panel flex flex-col items-center gap-1 px-2 py-3 text-center transition hover:bg-ink-700/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
            aria-label={t('songsChords.viewHandPositionsFor', { name: chord.name })}
          >
            <span className="font-display text-lg font-semibold text-parchment-100">{chord.name}</span>
            <span className="text-[10px] text-parchment-400/60">{chord.typeLabel}</span>
            <span className="text-[10px] text-parchment-400/40">
              {t('songsChords.shapeCount', { count: chord.shapes.length })}
            </span>
          </button>
        ))}
      </div>

      {openChord && (
        <ShapeViewer concept={toConcept(openChord)} initialIndex={0} onClose={() => setOpenChordId(null)} />
      )}
    </div>
  )
}
