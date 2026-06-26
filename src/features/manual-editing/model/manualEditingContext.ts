import { createContext, useContext } from 'react'

export type EditingTarget = {
  selector: string
  text: string
  rect: DOMRect
}

export type SaveState = 'idle' | 'loading' | 'saving' | 'saved' | 'dirty' | 'error'

export type ManualEditingContextValue = {
  active: boolean
  canEditCurrentPage: boolean
  editingTarget: EditingTarget | null
  hasUnsavedChanges: boolean
  saveState: SaveState
  setActive: (value: boolean) => void
  closeEditor: () => void
  applyTargetText: (text: string) => void
  commitManualEdits: () => Promise<void>
}

export const ManualEditingContext = createContext<ManualEditingContextValue | null>(null)

export function useManualEditing() {
  const context = useContext(ManualEditingContext)
  if (!context) {
    throw new Error('useManualEditing must be used inside ManualEditingProvider')
  }
  return context
}
