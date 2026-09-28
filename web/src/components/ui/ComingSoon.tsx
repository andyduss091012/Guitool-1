import { useLocale } from '../../hooks/useLocale'

interface ComingSoonProps {
  icon: string
  title: string
  phase: string
  description: string
  bullets: string[]
}

export default function ComingSoon({ icon, title, phase, description, bullets }: ComingSoonProps) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">{phase}</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold text-parchment-100">
          <span aria-hidden>{icon}</span> {title}
        </h1>
      </div>

      <section className="panel-raised flex flex-col gap-4 p-6">
        <span className="chip self-start">{t('common.comingSoon')}</span>
        <p className="text-sm text-parchment-300">{description}</p>
        <ul className="flex flex-col gap-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-parchment-300/90">
              <span className="text-brass-400" aria-hidden>
                ▸
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
