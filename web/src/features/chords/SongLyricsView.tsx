import { useState } from 'react'
import type { ChordConcept } from '../../types/musicConcept'
import { DEMO_SONGS, chordsUsedIn, type DemoSong } from '../../data/demoSongs'
import { findLibraryChordByName, type LibraryChord } from '../../data/chordLibrary'
import { parseChordProLine } from '../../utils/chordpro'
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
 * "Choosing songs and see the lyrics with chords" — picks from the small
 * original demo dataset in `data/demoSongs.ts` (see that file's doc
 * comment for why these are original songs, not a real catalog) and
 * renders each line with its chords floating above the lyric they apply to
 * (ChordPro-lite — `utils/chordpro.ts`). Tapping a chord name opens the
 * same shape viewer the Chord Library uses, so switching between "just
 * play along" and "show me that shape" is one tap.
 */
export default function SongLyricsView() {
  const { t } = useLocale()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openChordName, setOpenChordName] = useState<string | null>(null)
  const song = selectedId ? DEMO_SONGS.find((s) => s.id === selectedId) : undefined
  const openChord = openChordName ? findLibraryChordByName(openChordName) : undefined

  if (!song) {
    return <SongPicker songs={DEMO_SONGS} onSelect={setSelectedId} />
  }

  const chordNames = chordsUsedIn(song)

  return (
    <div className="flex flex-col gap-6">
      <button className="btn-ghost self-start" onClick={() => setSelectedId(null)}>
        {t('songsChords.backToSongs')}
      </button>

      <div>
        <p className="label-eyebrow">{t('songsChords.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{song.title}</h1>
        <p className="text-sm text-parchment-400/70">
          {t('songsChords.artistKeyOf', { artist: song.artist, key: song.key })}
        </p>
      </div>

      {chordNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('songsChords.chordsUsedInSong')}>
          {chordNames.map((name) => (
            <button key={name} type="button" onClick={() => setOpenChordName(name)} className="chip">
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="panel flex flex-col gap-3 px-5 py-5 font-mono">
        {song.lines.map((line, i) =>
          line === '' ? (
            <div key={i} className="h-2" aria-hidden />
          ) : (
            <LyricLine key={i} line={line} onSelectChord={setOpenChordName} />
          ),
        )}
      </div>

      {openChord && (
        <ShapeViewer concept={toConcept(openChord)} initialIndex={0} onClose={() => setOpenChordName(null)} />
      )}

      {openChordName && !openChord && (
        <p role="status" className="text-sm text-parchment-400/70">
          {t('songsChords.noDiagram', { name: openChordName })}
        </p>
      )}
    </div>
  )
}

function LyricLine({ line, onSelectChord }: { line: string; onSelectChord: (name: string) => void }) {
  const segments = parseChordProLine(line)
  return (
    <p className="flex flex-wrap items-end leading-tight">
      {segments.map((segment, i) => (
        <span key={i} className="relative inline-flex flex-col items-start">
          {segment.chord && (
            <button
              type="button"
              onClick={() => onSelectChord(segment.chord!)}
              className="mb-0.5 rounded px-0.5 text-xs font-semibold text-ember-400 hover:text-ember-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
            >
              {segment.chord}
            </button>
          )}
          <span className="whitespace-pre text-sm text-parchment-100">{segment.text || ' '}</span>
        </span>
      ))}
    </p>
  )
}

function SongPicker({ songs, onSelect }: { songs: DemoSong[]; onSelect: (id: string) => void }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-3">
      {songs.map((song) => (
        <button
          key={song.id}
          type="button"
          onClick={() => onSelect(song.id)}
          className="panel flex items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-ink-700/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass-400"
        >
          <div>
            <p className="font-display text-base font-medium tracking-wide text-parchment-100">{song.title}</p>
            <p className="text-xs text-parchment-400/70">{song.artist}</p>
          </div>
          <span className="chip shrink-0">{t('songsChords.keyOf', { key: song.key })}</span>
        </button>
      ))}
    </div>
  )
}
