import { Check, Pencil, Save, X } from 'lucide-react'
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { useManualEditing } from '../model/manualEditingContext.js'

function getStatusText(saveState: ReturnType<typeof useManualEditing>['saveState'], hasUnsavedChanges: boolean) {
  if (saveState === 'loading') return 'Загрузка правок'
  if (saveState === 'saving') return 'Сохранение'
  if (hasUnsavedChanges || saveState === 'dirty') return 'Есть несохраненные правки'
  if (saveState === 'saved') return 'Сохранено'
  if (saveState === 'error') return 'Не удалось сохранить'
  return 'Готово'
}

export default function EditModeToggle() {
  const {
    active,
    canEditCurrentPage,
    editingTarget,
    hasUnsavedChanges,
    saveState,
    setActive,
    closeEditor,
    applyTargetText,
    commitManualEdits,
  } = useManualEditing()
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setDraft(editingTarget?.text || '')
  }, [editingTarget])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    applyTargetText(draft)
  }

  const canSave = hasUnsavedChanges && saveState !== 'loading' && saveState !== 'saving'

  const handleCommit = () => {
    if (!canSave) return
    void commitManualEdits()
  }

  const handleSavePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleCommit()
  }

  const handleSaveKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleCommit()
  }

  return (
    <>
      <button
        className={`manual-edit-toggle${active ? ' manual-edit-toggle--active' : ''}`}
        type="button"
        disabled={!canEditCurrentPage}
        title={canEditCurrentPage ? 'Режим редактирования значений' : 'Редактирование доступно на дашборде и итогах года'}
        aria-pressed={active}
        onClick={() => setActive(!active)}
      >
        <Pencil size={18} />
        <span>{active ? 'Редактирование' : 'Правки'}</span>
      </button>

      {active && canEditCurrentPage && (
        <div className="manual-edit-status" data-manual-edit-ignore="true">
          <span>{getStatusText(saveState, hasUnsavedChanges)}</span>
        </div>
      )}

      {active && canEditCurrentPage && (
        <button
          className="manual-edit-save"
          data-manual-edit-ignore="true"
          type="button"
          disabled={!canSave}
          onKeyDown={handleSaveKeyDown}
          onPointerDown={handleSavePointerDown}
        >
          <Save size={16} />
          Сохранить
        </button>
      )}

      {editingTarget && (
        <form
          className="manual-edit-panel"
          data-manual-edit-ignore="true"
          style={{
            '--manual-edit-top': `${Math.min(Math.max(editingTarget.rect.bottom + 10, 16), window.innerHeight - 250)}px`,
            '--manual-edit-left': `${Math.min(Math.max(editingTarget.rect.left, 16), window.innerWidth - 420)}px`,
          } as CSSProperties}
          onSubmit={handleSubmit}
        >
          <div className="manual-edit-panel__header">
            <span>Значение</span>
            <button type="button" aria-label="Закрыть редактор" onClick={closeEditor}>
              <X size={18} />
            </button>
          </div>

          <textarea value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />

          <div className="manual-edit-panel__actions">
            <button type="submit">
              <Check size={16} />
              Применить
            </button>
          </div>
        </form>
      )}
    </>
  )
}
