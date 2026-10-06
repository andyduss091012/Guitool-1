import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, type LanguageCode } from '../i18n/languages'
import { TRANSLATIONS, type TranslationKey } from '../i18n/translations'
import { localize, type LocalizableText } from '../i18n/localizedText'

const STORAGE_KEY = 'guitool:language'

function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value)
}

function readStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored && isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE
}

interface LocaleContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  /**
   * Translates a key against the active language, falling back to English
   * for a key missing from a dictionary. `params`, when given, fills
   * `{paramName}` placeholders in the translated string (e.g. a dictionary
   * entry `"Shape {current} of {total}"` with `t('key', { current: 1, total: 3 })`
   * → `"Shape 1 of 3"`) — a placeholder with no matching param is left as-is.
   */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
  /** Resolves a content `LocalizedText` (see `i18n/localizedText.ts`) — or a plain string, returned unchanged — against the active language. */
  l: (text: LocalizableText) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * Language switcher. Exposes two ways to get translated text: `t(key)` for
 * the app's own fixed UI microcopy (see `i18n/translations.ts`), and
 * `l(text)` for per-item content authored in `src/data/**` (exercise
 * names, chord/scale descriptions, song lyrics, …) via the `LocalizedText`
 * shape in `i18n/localizedText.ts`. Every page and feature component in the
 * app is wired to one or both of these — switching language here changes
 * the whole app, not just the nav shell.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => readStoredLanguage())

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Private browsing / storage disabled — language choice just won't persist across reloads.
    }
  }, [language])

  const setLanguage = useCallback((next: LanguageCode) => setLanguageState(next), [])

  const t = useMemo(() => {
    const dictionary = TRANSLATIONS[language]
    const fallback = TRANSLATIONS[DEFAULT_LANGUAGE]
    return (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = dictionary[key] ?? fallback[key] ?? key
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
      )
    }
  }, [language])

  const l = useCallback((text: LocalizableText) => localize(text, language), [language])

  return <LocaleContext.Provider value={{ language, setLanguage, t, l }}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider')
  return ctx
}
