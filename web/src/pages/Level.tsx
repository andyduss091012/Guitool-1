import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuitool } from '../hooks/useGuitool'
import { PLAYER_LEVELS, type PlayerLevel } from '../types/progress'
import { useLocale } from '../hooks/useLocale'

export default function Level() {
  const { state, setLevel, ensureTodaySession } = useGuitool()
  const { t } = useLocale()
  const navigate = useNavigate()
  const currentLevel = state.settings.level
  const [justChanged, setJustChanged] = useState(false)

  const session = state.todaySession
  const canRegenerateToday = !!session && session.status !== 'completed'

  const handleSelect = (level: PlayerLevel) => {
    if (level === currentLevel) return
    setLevel(level)
    setJustChanged(true)
  }

  const handleRegenerate = () => {
    ensureTodaySession(true)
    setJustChanged(false)
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-eyebrow">{t('level.yourLevel')}</p>
        <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{t('level.headline')}</h1>
        <p className="mt-2 text-sm text-parchment-400/70">
          {t('level.descriptionPrefix')} <span className="text-ember-300">{t('level.mustLearnLabel')}</span>{' '}
          {t('level.descriptionSuffix')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {PLAYER_LEVELS.map((lvl) => {
          const active = lvl.id === currentLevel
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleSelect(lvl.id)}
              aria-pressed={active}
              className={[
                'panel flex flex-col gap-1.5 px-5 py-4 text-left transition',
                active ? 'ring-1 ring-ember-500/60 !bg-ember-500/10' : 'hover:bg-ink-700/50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-lg font-semibold tracking-wide text-parchment-100">
                  {lvl.label}
                </span>
                {active && (
                  <span className="chip shrink-0 !border-ember-500/60 !bg-ember-500/15 !text-ember-300">
                    {t('common.current')}
                  </span>
                )}
              </div>
              <p className="text-sm text-parchment-400/70">{lvl.description}</p>
            </button>
          )
        })}
      </div>

      {justChanged && (
        <div className="panel flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-parchment-300">
            {canRegenerateToday ? t('level.updatedRegenerateMessage') : t('level.updatedTomorrowMessage')}
          </p>
          {canRegenerateToday && (
            <button className="btn-secondary shrink-0" onClick={handleRegenerate}>
              🔄 {t('level.regenerateToday')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
