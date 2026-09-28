import ComingSoon from '../../components/ui/ComingSoon'
import { useLocale } from '../../hooks/useLocale'

/**
 * Placeholder for the Phase 3 song library. This app does not scrape or
 * reproduce copyrighted tab content. When this feature is built, it should
 * either integrate a licensed/legal tab provider behind this feature
 * folder, or use mock/local song data for demo purposes only.
 */
export default function SongsPlaceholder() {
  const { t } = useLocale()
  return (
    <ComingSoon
      icon="📜"
      phase={t('songs.placeholderPhase')}
      title={t('songs.placeholderTitle')}
      description={t('songs.placeholderDescription')}
      bullets={[t('songs.placeholderBullet1'), t('songs.placeholderBullet2'), t('songs.placeholderBullet3')]}
    />
  )
}
