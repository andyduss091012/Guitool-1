import { useState } from 'react'
import { useGuitool } from '../hooks/useGuitool'
import type { Exercise } from '../types/exercise'
import type { CustomExerciseInput } from '../services/exerciseLibrary'
import ExerciseLibraryList from '../features/library/ExerciseLibraryList'
import AddExerciseForm from '../features/library/AddExerciseForm'
import ExerciseDetailView from '../features/library/ExerciseDetailView'
import { useLocale } from '../hooks/useLocale'

type View =
  | { mode: 'list' }
  | { mode: 'detail'; exercise: Exercise }
  | { mode: 'add'; duplicateFrom?: Exercise }
  | { mode: 'edit'; exercise: Exercise }

export default function Library() {
  const { t } = useLocale()
  const { exercises, addCustomExercise, editCustomExercise, removeCustomExercise } = useGuitool()
  const [view, setView] = useState<View>({ mode: 'list' })

  const handleSelect = (exercise: Exercise) => {
    setView(exercise.isCustom ? { mode: 'edit', exercise } : { mode: 'detail', exercise })
  }

  const handleAddSubmit = (input: CustomExerciseInput) => {
    addCustomExercise(input)
    setView({ mode: 'list' })
  }

  const handleEditSubmit = (id: string) => (input: CustomExerciseInput) => {
    editCustomExercise(id, input)
    setView({ mode: 'list' })
  }

  const handleDelete = (id: string) => () => {
    removeCustomExercise(id)
    setView({ mode: 'list' })
  }

  if (view.mode === 'add') {
    return (
      <div className="flex flex-col gap-6">
        <button className="btn-ghost self-start" onClick={() => setView({ mode: 'list' })}>
          {t('library.backToLibrary')}
        </button>
        <div>
          <p className="label-eyebrow">{t('library.newExercise')}</p>
          <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{t('library.addToLibraryHeading')}</h1>
        </div>
        <AddExerciseForm
          initial={view.duplicateFrom}
          onCancel={() => setView({ mode: 'list' })}
          onSubmit={handleAddSubmit}
        />
      </div>
    )
  }

  if (view.mode === 'edit') {
    return (
      <div className="flex flex-col gap-6">
        <button className="btn-ghost self-start" onClick={() => setView({ mode: 'list' })}>
          {t('library.backToLibrary')}
        </button>
        <div>
          <p className="label-eyebrow">{t('library.customExercise')}</p>
          <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{view.exercise.name}</h1>
        </div>
        <AddExerciseForm
          initial={view.exercise}
          onCancel={() => setView({ mode: 'list' })}
          onSubmit={handleEditSubmit(view.exercise.id)}
          onDelete={handleDelete(view.exercise.id)}
        />
      </div>
    )
  }

  if (view.mode === 'detail') {
    return (
      <ExerciseDetailView
        exercise={view.exercise}
        onBack={() => setView({ mode: 'list' })}
        onDuplicate={() => setView({ mode: 'add', duplicateFrom: view.exercise })}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">{t('library.libraryLabel')}</p>
          <h1 className="mt-1 text-3xl font-semibold text-parchment-100">{t('library.yourExercises')}</h1>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setView({ mode: 'add' })}>
          {t('library.addExercise')}
        </button>
      </div>

      <p className="text-sm text-parchment-400/70">{t('library.addedExercisesNote')}</p>

      <ExerciseLibraryList exercises={exercises} onEdit={handleSelect} />
    </div>
  )
}
