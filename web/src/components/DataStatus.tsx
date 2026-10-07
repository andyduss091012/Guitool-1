import type { LoadStatus } from '../hooks/useChordLibrary'
import { useLocale } from '../hooks/useLocale'

/** Shown while built-in content is loading from the API, or when that failed. Renders nothing once ready (and always in local mode). */
export default function DataStatus({ status, error, onRetry }: { status: LoadStatus; error?: string; onRetry: () => void }) {
  const { t } = useLocale()
  if (status === 'ready') return null
  if (status === 'loading') {
    return (
      <p role="status" className="text-sm text-parchment-400/70">
        {t('data.loading')}
      </p>
    )
  }
  return (
    <div role="alert" className="panel flex flex-col gap-2 px-4 py-3 text-sm text-parchment-200">
      <p>{t('data.loadError', { message: error ?? '' })}</p>
      <button type="button" className="btn-ghost self-start" onClick={onRetry}>
        {t('data.retry')}
      </button>
    </div>
  )
}
