import ComingSoon from '../../components/ui/ComingSoon'
import { useLocale } from '../../hooks/useLocale'

/**
 * Placeholder for the Phase 4 amp/tone feature. Amp controls should be
 * modeled dynamically per amp (not every amp has the same knobs), so the
 * eventual data model here is an array of { id, label, min, max } controls
 * per amp rather than a fixed Gain/Bass/Mid/Treble/Presence shape.
 */
export default function AmpTonesPlaceholder() {
  const { t } = useLocale()
  return (
    <ComingSoon
      icon="🔊"
      phase={t('ampTones.phase')}
      title={t('nav.ampTones')}
      description={t('ampTones.description')}
      bullets={[
        t('ampTones.bullet.songSuggestions'),
        t('ampTones.bullet.ampLibrary'),
        t('ampTones.bullet.perAmpControls'),
      ]}
    />
  )
}
