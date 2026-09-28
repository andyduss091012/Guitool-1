import { useMemo, useState, type FormEvent } from 'react'
import type { Song, SongGenre } from '../../types/song'
import { SONG_GENRES } from '../../types/song'
import { validateCustomSongInput, type CustomSongInput } from '../../services/songLibrary'
import { buildSongLookupLinks } from '../../services/webLookup'
import LookupOnlineLinks from '../library/LookupOnlineLinks'
import { useLocale } from '../../hooks/useLocale'

const TUNING_PRESETS = [
  'Standard (EADGBE)',
  'Drop D',
  'Half-step down (Eb standard)',
  'Open G',
  'Open D',
]

interface FormState {
  title: string
  artist: string
  genre: SongGenre
  difficulty: number
  tuning: string
  capo: string
  keySignature: string
  practiceNotes: string
  tagsRaw: string
}

function blankForm(): FormState {
  return {
    title: '',
    artist: '',
    genre: 'Rock',
    difficulty: 3,
    tuning: TUNING_PRESETS[0],
    capo: '',
    keySignature: '',
    practiceNotes: '',
    tagsRaw: '',
  }
}

function songToForm(song: Song): FormState {
  return {
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    difficulty: song.difficulty,
    tuning: song.tuning,
    capo: song.capo ? String(song.capo) : '',
    keySignature: song.keySignature ?? '',
    practiceNotes: song.practiceNotes,
    tagsRaw: song.tags.join(', '),
  }
}

function formToInput(form: FormState): CustomSongInput {
  return {
    title: form.title,
    artist: form.artist,
    genre: form.genre,
    difficulty: form.difficulty,
    tuning: form.tuning,
    capo: form.capo ? Number(form.capo) : undefined,
    keySignature: form.keySignature || undefined,
    practiceNotes: form.practiceNotes,
    tags: form.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
  }
}

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-parchment-400/70">{label}</label>
        <span className="font-display text-sm text-brass-300">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-ember-500"
      />
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-ink-600 bg-ink-900/60 px-3 py-2 text-sm text-parchment-100 placeholder:text-parchment-500/50 focus:border-ember-500 focus:outline-none'

export default function AddSongForm({
  initial,
  onCancel,
  onSubmit,
  onDelete,
}: {
  initial?: Song
  onCancel: () => void
  onSubmit: (input: CustomSongInput) => void
  onDelete?: () => void
}) {
  const { t } = useLocale()
  const [form, setForm] = useState<FormState>(() => (initial ? songToForm(initial) : blankForm()))
  const [errors, setErrors] = useState<string[]>([])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const input = useMemo(() => formToInput(form), [form])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const validationErrors = validateCustomSongInput(input)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.songTitleLabel')}
          </label>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={t('songs.songTitlePlaceholder')}
            maxLength={100}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.artistLabel')}
          </label>
          <input
            className={inputClass}
            value={form.artist}
            onChange={(e) => update('artist', e.target.value)}
            placeholder={t('songs.artistPlaceholder')}
            maxLength={80}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.getTabChords')}
          </p>
          <LookupOnlineLinks
            links={buildSongLookupLinks(form.title, form.artist)}
            emptyHint={t('songs.lookupEmptyHint')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.genreLabel')}
          </label>
          <select
            className={inputClass}
            value={form.genre}
            onChange={(e) => update('genre', e.target.value as SongGenre)}
          >
            {SONG_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-5">
        <RatingSlider label={t('songs.difficultyLabel')} value={form.difficulty} onChange={(v) => update('difficulty', v)} />
      </section>

      <section className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.tuningLabel')}
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {TUNING_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => update('tuning', preset)}
                className={
                  form.tuning === preset
                    ? 'chip !border-ember-500/60 !bg-ember-500/15 !text-ember-300'
                    : 'chip !text-parchment-400/70 hover:!text-parchment-200'
                }
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            className={inputClass}
            value={form.tuning}
            onChange={(e) => update('tuning', e.target.value)}
            placeholder="Standard (EADGBE)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
              {t('songs.capoLabel')}
            </label>
            <input
              type="number"
              min={0}
              max={12}
              className={inputClass}
              value={form.capo}
              onChange={(e) => update('capo', e.target.value)}
              placeholder={t('songs.capoPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
              {t('songs.keyLabel')}
            </label>
            <input
              className={inputClass}
              value={form.keySignature}
              onChange={(e) => update('keySignature', e.target.value)}
              placeholder={t('songs.keyPlaceholder')}
            />
          </div>
        </div>
      </section>

      <section className="panel flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.practiceNotesLabel')}
          </label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.practiceNotes}
            onChange={(e) => update('practiceNotes', e.target.value)}
            placeholder={t('songs.practiceNotesPlaceholder')}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-parchment-400/70">
            {t('songs.tagsLabel')}
          </label>
          <input
            className={inputClass}
            value={form.tagsRaw}
            onChange={(e) => update('tagsRaw', e.target.value)}
            placeholder={t('songs.tagsPlaceholder')}
          />
        </div>
      </section>

      {errors.length > 0 && (
        <div className="rounded-xl border border-ember-600/50 bg-ember-500/10 px-4 py-3">
          <ul className="flex flex-col gap-1 text-sm text-ember-300">
            {errors.map((err) => (
              <li key={err}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">
          {initial ? t('songs.saveChanges') : t('songs.addToSongsButton')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        {onDelete && (
          <button type="button" className="btn-ghost ml-auto !text-ember-400" onClick={onDelete}>
            {t('songs.deleteSong')}
          </button>
        )}
      </div>
    </form>
  )
}
