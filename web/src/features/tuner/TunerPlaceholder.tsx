import ComingSoon from '../../components/ui/ComingSoon'
import { useLocale } from '../../hooks/useLocale'

/**
 * Placeholder for the Phase 2 tuner. The real implementation will use the
 * Web Audio API (AnalyserNode + autocorrelation pitch detection) against
 * the microphone, isolated behind this feature folder so the detection
 * algorithm can be swapped or improved without touching the rest of the app.
 */
export default function TunerPlaceholder() {
  const { t } = useLocale()
  return (
    <ComingSoon
      icon="🎵"
      phase={t('tuner.phase')}
      title={t('nav.tuner')}
      description={t('tuner.description')}
      bullets={[t('tuner.bullet.livePitch'), t('tuner.bullet.needleDisplay'), t('tuner.bullet.fallback')]}
    />
  )
}
