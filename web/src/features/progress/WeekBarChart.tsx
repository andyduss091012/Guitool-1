import type { DayMinutes } from '../../services/progressStats'
import { formatShortDay } from '../../utils/date'
import { useLocale } from '../../hooks/useLocale'

export default function WeekBarChart({ days }: { days: DayMinutes[] }) {
  const { t } = useLocale()
  const max = Math.max(1, ...days.map((d) => d.minutes))

  return (
    <div>
      <div className="flex items-end gap-2.5 sm:gap-3" role="img" aria-label={t('progress.weekChartAriaLabel')}>
        {days.map((d) => {
          const heightPct = Math.max(4, (d.minutes / max) * 100)
          const isToday = d.dateKey === days[days.length - 1].dateKey
          return (
            <div key={d.dateKey} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] tabular-nums text-parchment-400/70">{d.minutes || ''}</span>
              <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-ink-700/60 sm:h-28">
                <div
                  className={
                    'w-full rounded-t-md transition-all duration-300 ' +
                    (isToday ? 'bg-gradient-to-t from-ember-600 to-ember-400' : 'bg-gradient-to-t from-brass-600 to-brass-400')
                  }
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[11px] uppercase tracking-wide text-parchment-400/60">
                {formatShortDay(d.dateKey)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
