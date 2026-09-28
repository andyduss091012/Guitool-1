import type { FretboardDiagram as FretboardDiagramData, StringNumber } from '../../types/exercise'
import { useLocale } from '../../hooks/useLocale'

/**
 * Renders a fret-position diagram — an original, generated SVG computed from
 * plain note/finger data (see the `diagram` field on `Exercise`), not a copy
 * of any book's or website's image. Two layouts:
 *
 * - 'scale': the familiar horizontal "box pattern" view (strings as rows,
 *   frets as columns), read top-to-bottom as low E → high e — how you'd see
 *   the neck looking down at it in playing position.
 * - 'chord': the familiar vertical chord-chart view (strings as columns,
 *   frets as rows), left-to-right as low E → high e, with × / O markers
 *   above the nut for muted/open strings.
 *
 * Root notes are filled brass; other notes are filled ember. The small
 * number inside each dot is the suggested fretting-hand finger.
 */

const STRING_LABELS: Record<StringNumber, string> = {
  1: 'E',
  2: 'A',
  3: 'D',
  4: 'G',
  5: 'B',
  6: 'e',
}

export default function FretboardDiagram({ diagram }: { diagram: FretboardDiagramData }) {
  return diagram.mode === 'chord' ? <ChordDiagram diagram={diagram} /> : <ScaleDiagram diagram={diagram} />
}

function ScaleDiagram({ diagram }: { diagram: FretboardDiagramData }) {
  const { t } = useLocale()
  const { startFret, fretCount, notes, caption } = diagram
  const leftLabelWidth = 22
  const fretWidth = 52
  const topPad = 10
  const stringGap = 26
  const rightPad = 14
  const bottomLabelHeight = 22

  const width = leftLabelWidth + fretCount * fretWidth + rightPad
  const gridHeight = 5 * stringGap
  const height = topPad + gridHeight + bottomLabelHeight

  const xForFret = (fret: number) => leftLabelWidth + (fret - startFret + 0.5) * fretWidth
  const xForFretLine = (fret: number) => leftLabelWidth + (fret - startFret) * fretWidth
  const yForString = (s: StringNumber) => topPad + (s - 1) * stringGap

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={caption ?? t('fretboardDiagram.scaleDiagramLabel')}
      >
        {/* string lines */}
        {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((s) => (
          <line
            key={s}
            x1={leftLabelWidth}
            x2={leftLabelWidth + fretCount * fretWidth}
            y1={yForString(s)}
            y2={yForString(s)}
            className="stroke-parchment-400/40"
            strokeWidth={1.5}
          />
        ))}
        {/* fret lines */}
        {Array.from({ length: fretCount + 1 }, (_, i) => i).map((i) => (
          <line
            key={i}
            x1={xForFretLine(startFret + i)}
            x2={xForFretLine(startFret + i)}
            y1={topPad}
            y2={topPad + gridHeight}
            className="stroke-parchment-400/30"
            strokeWidth={1}
          />
        ))}
        {/* string name labels */}
        {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((s) => (
          <text
            key={s}
            x={leftLabelWidth - 8}
            y={yForString(s)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-parchment-400/70 text-[10px] font-medium"
          >
            {STRING_LABELS[s]}
          </text>
        ))}
        {/* fret number labels (every fret, small) */}
        {Array.from({ length: fretCount }, (_, i) => startFret + i).map((fret) => (
          <text
            key={fret}
            x={xForFret(fret)}
            y={topPad + gridHeight + 14}
            textAnchor="middle"
            className="fill-parchment-400/60 text-[9px]"
          >
            {fret}
          </text>
        ))}
        {/* notes */}
        {notes.map((n, i) => (
          <g key={i}>
            <circle
              cx={xForFret(n.fret)}
              cy={yForString(n.string)}
              r={9}
              className={n.root ? 'fill-brass-500 stroke-brass-300' : 'fill-ember-500 stroke-ember-300'}
              strokeWidth={1}
            />
            {n.finger && (
              <text
                x={xForFret(n.fret)}
                y={yForString(n.string)}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-parchment-100 text-[10px] font-bold"
              >
                {n.finger}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Legend />
      {caption && <figcaption className="text-center text-xs text-parchment-400/70">{caption}</figcaption>}
    </figure>
  )
}

function ChordDiagram({ diagram }: { diagram: FretboardDiagramData }) {
  const { t } = useLocale()
  const { startFret, fretCount, notes, mutedStrings = [], caption } = diagram
  const topMarkerHeight = 20
  const leftPad = 24
  const stringGap = 26
  const fretHeight = 30
  const rightPad = 14
  const bottomPad = 10
  const nutHeight = startFret === 1 ? 4 : 1

  const width = leftPad + 5 * stringGap + rightPad
  const gridHeight = fretCount * fretHeight
  const height = topMarkerHeight + gridHeight + bottomPad

  const xForString = (s: StringNumber) => leftPad + (s - 1) * stringGap
  const yForFretLine = (fret: number) => topMarkerHeight + (fret - startFret) * fretHeight
  const yForFret = (fret: number) => topMarkerHeight + (fret - startFret + 0.5) * fretHeight

  const stringsWithNotes = new Set(notes.map((n) => n.string))
  const openStrings: StringNumber[] =
    startFret === 1 ? ([1, 2, 3, 4, 5, 6] as StringNumber[]).filter((s) => !stringsWithNotes.has(s) && !mutedStrings.includes(s)) : []

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={caption ?? t('fretboardDiagram.chordDiagramLabel')}
      >
        {startFret > 1 && (
          <text
            x={leftPad - 8}
            y={topMarkerHeight + 12}
            textAnchor="end"
            className="fill-parchment-400/70 text-[10px] font-medium"
          >
            {startFret}fr
          </text>
        )}
        {/* mute / open markers above the nut */}
        {mutedStrings.map((s) => (
          <text
            key={`mute-${s}`}
            x={xForString(s)}
            y={topMarkerHeight - 8}
            textAnchor="middle"
            className="fill-ember-400 text-[11px] font-bold"
          >
            ×
          </text>
        ))}
        {openStrings.map((s) => (
          <text
            key={`open-${s}`}
            x={xForString(s)}
            y={topMarkerHeight - 8}
            textAnchor="middle"
            className="fill-parchment-300 text-[11px] font-bold"
          >
            O
          </text>
        ))}
        {/* string lines */}
        {([1, 2, 3, 4, 5, 6] as StringNumber[]).map((s) => (
          <line
            key={s}
            x1={xForString(s)}
            x2={xForString(s)}
            y1={topMarkerHeight}
            y2={topMarkerHeight + gridHeight}
            className="stroke-parchment-400/40"
            strokeWidth={1.5}
          />
        ))}
        {/* fret lines (nut is thicker when the diagram starts at the nut) */}
        {Array.from({ length: fretCount + 1 }, (_, i) => i).map((i) => (
          <line
            key={i}
            x1={xForString(1)}
            x2={xForString(6)}
            y1={yForFretLine(startFret + i)}
            y2={yForFretLine(startFret + i)}
            className="stroke-parchment-400/40"
            strokeWidth={i === 0 ? nutHeight : 1}
          />
        ))}
        {/* notes */}
        {notes.map((n, i) => (
          <g key={i}>
            <circle
              cx={xForString(n.string)}
              cy={yForFret(n.fret)}
              r={9}
              className={n.root ? 'fill-brass-500 stroke-brass-300' : 'fill-ember-500 stroke-ember-300'}
              strokeWidth={1}
            />
            {n.finger && (
              <text
                x={xForString(n.string)}
                y={yForFret(n.fret)}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-parchment-100 text-[10px] font-bold"
              >
                {n.finger}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Legend />
      {caption && <figcaption className="text-center text-xs text-parchment-400/70">{caption}</figcaption>}
    </figure>
  )
}

function Legend() {
  const { t } = useLocale()
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-parchment-400/60">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-brass-500" /> {t('fretboardDiagram.rootNote')}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-ember-500" /> {t('fretboardDiagram.note')}
      </span>
      <span>{t('fretboardDiagram.fingerCaption')}</span>
    </div>
  )
}
