import type { LanguageCode } from './languages'

/**
 * A piece of *content* text (an exercise's name/instructions, a chord
 * concept's description, a demo song's lyric line, …) with per-language
 * variants — as opposed to `TranslationKey` in `translations.ts`, which is
 * for the app's own UI microcopy. Content lives in `src/data/**`, is
 * authored once in English (`en`, required — also the fallback for any
 * language missing a translation), and gets its other languages filled in
 * by `localize()`/`useLocalize()` at render time.
 *
 * Kept as a separate concept from `TranslationKey` because content strings
 * are per-item (per exercise, per song, …) rather than a fixed, finite set
 * of UI labels — they don't fit a flat `Record<TranslationKey, string>`
 * dictionary the same way.
 */
export type LocalizedText = { en: string } & Partial<Record<Exclude<LanguageCode, 'en'>, string>>

/**
 * A field that may hold built-in, translated content (`LocalizedText`) or a
 * plain string — the latter covers user-authored content (custom exercises,
 * custom songs, …) that was only ever entered in one language and should
 * never be forced through translation.
 */
export type LocalizableText = string | LocalizedText

/** Resolves a `LocalizedText` (or a plain `string`, returned unchanged) against a language, falling back to English when that language's variant is missing. */
export function localize(text: LocalizableText, language: LanguageCode): string {
  if (typeof text === 'string') return text
  return text[language] ?? text.en
}

/** Convenience for a `LocalizedText` that's only ever going to be English (e.g. a proper noun) — avoids `{ en: x }` boilerplate at call sites that build these programmatically. */
export function enOnly(en: string): LocalizedText {
  return { en }
}
