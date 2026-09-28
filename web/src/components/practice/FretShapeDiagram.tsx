import type { FretPositionRole, FretShape, StringNumber } from '../../types/musicConcept'
import { noteNameAtPosition } from '../../utils/fretboardNotes'
import { useLocale } from '../../hooks/useLocale'
import type { TranslationKey } from '../../i18n/translations'

/**
 * Renders one `FretShape` from the music-concept content model (see
 * `types/musicConcept.ts`) — an original, generated SVG computed from plain
 * note/role/finger data, not a copy of any book's or website's image.
 *
 * This is the concept-model sibling of `FretboardDiagram.tsx` (which still
 * renders the older, single-shape `Exercise.diagram` field for exercises
 * not yet migrated to the concept model). The two intentionally share their
 * visual language — same layout math, same palette — so a diagram looks
 * the same to the user whichever system produced it; they're kept as
 * separate components rather than merged so migrating existing exercises
 * to concepts never risks changing the legacy diagrams still in use.
 *
 * `mode` picks the layout: 'scale' draws the familiar horizontal box-pattern
 * view (strings as rows, frets as columns) used for scale/arpeggio
 * positions; 'chord' draws the familiar vertical chord-chart view (strings
 * as columns, frets as rows) with × / O markers above the nut.
 *
 * `labelMode` picks what small text sits inside each dot: 'finger' (the
 * default — a suggested fretting-hand finger, when the position has one),
 * 'note' (the note name, computed from string+fret), or 'interval' (the
 * scale-degree/chord-tone label — from `position.interval` for scales, or
 * derived from `position.role` for chords). Only one fits legibly inside a
 * 9px-radius dot, so this is a single mode rather than independent toggles;
 * `ShapeViewer` cycles through the three instead of layering them.
 */

const STRING_LABELS: Record<StringNumber, string> = {
  1: 'E',
  2: 'A',
  3: 'D',
  4: 'G',
  5: 'B',
  6: 'e',
}

const ROLE_FILL: Record<FretPositionRole, string> = {
  root: 'fill-brass-500 stroke-brass-300',
  third: 'fill-ember-300 stroke-ember-300',
  fifth: 'fill-ember-600 stroke-ember-400',
  note: 'fill-ember-500 stroke-ember-300',
  other: 'fill-ember-500 stroke-ember-300',
}

function roleClass(role: FretPositionRole | undefined) {
  return ROLE_FILL[role ?? 'note']
}

export type DiagramLabelMode = 'finger' | 'note' | 'interval'

const ROLE_INTERVAL: Partial<Record<FretPositionRole, string>> = {
  root: '1',
  third: '3',
  fifth: '5',
}

function labelFor(
  labelMode: DiagramLabelMode,
  p: { string: StringNumber; fret: number; finger?: number; interval?: string; role?: FretPositionRole },
): string | undefined {
  if (labelMode === 'note') return noteNameAtPosition(p.string, p.fret)
  if (labelMode === 'interval') return p.interval ?? (p.role ? ROLE_INTERVAL[p.role] : undefined)
  return p.finger ? String(p.finger) : undefined
}

export default function FretShapeDiagram({
  shape,
  mode,
  labelMode = 'finger',
}: {
  shape: FretShape
  mode: 'scale' | 'chord'
  /** What text shows inside each dot. Defaults to 'finger' (the original behavior). */
  labelMode?: DiagramLabelMode
}) {
  return mode === 'chord' ? (
    <ChordLayout shape={shape} labelMode={labelMode} />
  ) : (
    <ScaleLayout shape={shape} labelMode={labelMode} />
  )
}

function ScaleLayout({ shape, labelMode }: { shape: FretShape; labelMode: DiagramLabelMode }) {
  const { startFret, fretCount, positions, caption } = shape
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
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={caption ?? shape.label}>
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
        {positions.map((p, i) => {
          const label = labelFor(labelMode, p)
          return (
            <g key={i}>
              <circle cx={xForFret(p.fret)} cy={yForString(p.string)} r={9} className={roleClass(p.role)} strokeWidth={1} />
              {label && (
                <text
                  x={xForFret(p.fret)}
                  y={yForString(p.string)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-parchment-100 text-[10px] font-bold"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <Legend labelMode={labelMode} />
      {caption && <figcaption className="text-center text-xs text-parchment-400/70">{caption}</figcaption>}
    </figure>
  )
}

function ChordLayout({ shape, labelMode }: { shape: FretShape; labelMode: DiagramLabelMode }) {
  const { startFret, fretCount, positions, mutedStrings = [], caption } = shape
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

  const stringsWithNotes = new Set(positions.map((p) => p.string))
  const openStrings: StringNumber[] =
    startFret === 1
      ? ([1, 2, 3, 4, 5, 6] as StringNumber[]).filter((s) => !stringsWithNotes.has(s) && !mutedStrings.includes(s))
      : []

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={caption ?? shape.label}>
        {startFret > 1 && (
          <text x={leftPad - 8} y={topMarkerHeight + 12} textAnchor="end" className="fill-parchment-400/70 text-[10px] font-medium">
            {startFret}fr
          </text>
        )}
        {mutedStrings.map((s) => (
          <text key={`mute-${s}`} x={xForString(s)} y={topMarkerHeight - 8} textAnchor="middle" className="fill-ember-400 text-[11px] font-bold">
            ×
          </text>
        ))}
        {openStrings.map((s) => (
          <text key={`open-${s}`} x={xForString(s)} y={topMarkerHeight - 8} textAnchor="middle" className="fill-parchment-300 text-[11px] font-bold">
            O
          </text>
        ))}
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
        {positions.map((p, i) => {
          const label = labelFor(labelMode, p)
          return (
            <g key={i}>
              <circle cx={xForString(p.string)} cy={yForFret(p.fret)} r={9} className={roleClass(p.role)} strokeWidth={1} />
              {label && (
                <text
                  x={xForString(p.string)}
                  y={yForFret(p.fret)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-parchment-100 text-[10px] font-bold"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <Legend labelMode={labelMode} />
      {caption && <figcaption className="text-center text-xs text-parchment-400/70">{caption}</figcaption>}
    </figure>
  )
}

function Legend({ labelMode }: { labelMode: DiagramLabelMode }) {
  const { t } = useLocale()
  const captionKey: Record<DiagramLabelMode, TranslationKey> = {
    finger: 'fretShapeDiagram.fingerCaption',
    note: 'fretShapeDiagram.noteCaption',
    interval: 'fretShapeDiagram.intervalCaption',
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-parchment-400/60">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-brass-500" /> {t('fretShapeDiagram.root')}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-ember-300" /> {t('fretShapeDiagram.third')}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-ember-600" /> {t('fretShapeDiagram.fifth')}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-ember-500" /> {t('fretShapeDiagram.note')}
      </span>
      <span>{t(captionKey[labelMode])}</span>
    </div>
  )
}
