import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createEmptyManualEditsStore,
  getManualEdits,
  putManualEdits,
  type ManualEditsStore,
} from './manualEditingApi.js'
import {
  ManualEditingContext,
  type EditingTarget,
  type ManualEditingContextValue,
  type SaveState,
} from './manualEditingContext.js'

type ManualEditingProviderProps = {
  children: ReactNode
  editablePages: string[]
  pageKey: string
}

const LOCAL_STORAGE_KEY = 'university-dashboard-manual-edits'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeStore(value: unknown): ManualEditsStore {
  if (!isRecord(value) || !isRecord(value.pages)) return createEmptyManualEditsStore()

  const pages: ManualEditsStore['pages'] = {}

  Object.entries(value.pages).forEach(([pageKey, pageValue]) => {
    if (!isRecord(pageValue)) return

    const pageEntries: ManualEditsStore['pages'][string] = {}

    Object.entries(pageValue).forEach(([selector, editValue]) => {
      if (!isRecord(editValue) || typeof editValue.text !== 'string') return

      pageEntries[selector] = {
        text: editValue.text,
        updatedAt: typeof editValue.updatedAt === 'string' ? editValue.updatedAt : new Date().toISOString(),
      }
    })

    pages[pageKey] = pageEntries
  })

  return {
    version: 1,
    pages,
  }
}

function readLocalStore(): ManualEditsStore {
  try {
    return normalizeStore(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || 'null'))
  } catch {
    return createEmptyManualEditsStore()
  }
}

function writeLocalStore(store: ManualEditsStore) {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store))
}

function isElement(value: EventTarget | null): value is Element {
  return value instanceof Element
}

function isEditableCandidate(element: Element): boolean {
  const text = element.textContent?.replace(/\s+/g, ' ').trim() || ''
  if (!text || text.length > 600) return false

  const tagName = element.tagName.toLowerCase()
  if (['script', 'style', 'input', 'textarea', 'select', 'option', 'canvas'].includes(tagName)) return false
  if (element.closest('.manual-edit-panel, .manual-edit-toggle, .theme-switcher, .page-tabs')) return false
  if (element.closest('[data-manual-edit-ignore="true"]')) return false

  const ownText = Array.from(element.childNodes).some((node) => (
    node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
  ))

  return ownText || ['td', 'th', 'button', 'text', 'tspan'].includes(tagName)
}

function findEditableElement(target: EventTarget | null, root: Element): Element | null {
  if (!isElement(target)) return null

  let current: Element | null = target

  while (current && current !== root) {
    if (root.contains(current) && isEditableCandidate(current)) return current
    current = current.parentElement
  }

  return null
}

function getElementSelector(element: Element, root: Element): string {
  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== root) {
    const parent: ParentNode | null = current.parentElement || current.parentNode
    if (!parent) break

    const siblings = Array.from(parent.children).filter((item) => item.tagName === current?.tagName)
    const index = siblings.indexOf(current) + 1
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${Math.max(index, 1)})`)
    current = current.parentElement
  }

  return parts.join(' > ')
}

function getScope(): Element | null {
  return document.querySelector('[data-manual-edit-scope="true"]')
}

function applyPageEdits(pageKey: string, store: ManualEditsStore) {
  const root = getScope()
  if (!root) return

  Object.entries(store.pages[pageKey] || {}).forEach(([selector, entry]) => {
    const element = root.querySelector(selector)
    if (!element || element.textContent === entry.text) return
    element.textContent = entry.text
  })
}

export function ManualEditingProvider({ children, editablePages, pageKey }: ManualEditingProviderProps) {
  const [active, setActiveState] = useState(false)
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null)
  const [store, setStore] = useState<ManualEditsStore>(() => createEmptyManualEditsStore())
  const [saveState, setSaveState] = useState<SaveState>('loading')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const pageKeyRef = useRef(pageKey)
  const storeRef = useRef(store)
  const hasUnsavedChangesRef = useRef(false)
  const applyingRef = useRef(false)
  const editablePagesSet = useMemo(() => new Set(editablePages), [editablePages])
  const canEditCurrentPage = editablePagesSet.has(pageKey)

  useEffect(() => {
    pageKeyRef.current = pageKey
    setEditingTarget(null)
  }, [pageKey])

  useEffect(() => {
    storeRef.current = store
  }, [store])

  useEffect(() => {
    let mounted = true

    getManualEdits()
      .then((remoteStore) => {
        if (!mounted) return
        if (hasUnsavedChangesRef.current) {
          setSaveState('dirty')
          return
        }
        const normalizedStore = normalizeStore(remoteStore)
        storeRef.current = normalizedStore
        setStore(normalizedStore)
        writeLocalStore(normalizedStore)
        setSaveState('idle')
      })
      .catch((error: unknown) => {
        console.warn('Manual edits load failed, using local copy:', error)
        if (!mounted) return
        if (hasUnsavedChangesRef.current) {
          setSaveState('dirty')
          return
        }
        const localStore = readLocalStore()
        storeRef.current = localStore
        setStore(localStore)
        setSaveState('error')
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const run = () => {
      applyingRef.current = true
      applyPageEdits(pageKey, store)
      window.requestAnimationFrame(() => {
        applyingRef.current = false
      })
    }

    const frame = window.requestAnimationFrame(run)
    const root = getScope()

    if (!root) {
      return () => window.cancelAnimationFrame(frame)
    }

    const observer = new MutationObserver(() => {
      if (applyingRef.current) return
      window.requestAnimationFrame(run)
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pageKey, store])

  const commitManualEdits = useCallback(async () => {
    const nextStore = normalizeStore(storeRef.current)
    setSaveState('saving')

    try {
      const savedStore = await putManualEdits(nextStore)
      const normalizedStore = normalizeStore(savedStore)
      storeRef.current = normalizedStore
      hasUnsavedChangesRef.current = false
      setStore(normalizedStore)
      writeLocalStore(normalizedStore)
      setHasUnsavedChanges(false)
      setSaveState('saved')
    } catch (error) {
      console.error('Manual edits save failed:', error)
      setSaveState('error')
    }
  }, [])

  const setActive = useCallback((value: boolean) => {
    setActiveState(value && canEditCurrentPage)
    if (!value) setEditingTarget(null)
  }, [canEditCurrentPage])

  useEffect(() => {
    if (!canEditCurrentPage) {
      setActiveState(false)
      setEditingTarget(null)
    }
  }, [canEditCurrentPage])

  useEffect(() => {
    if (!active || !canEditCurrentPage) return undefined

    const handlePointerDown = (event: PointerEvent) => {
      const root = getScope()
      if (!root) return

      const editableElement = findEditableElement(event.target, root)
      if (!editableElement) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      setEditingTarget({
        selector: getElementSelector(editableElement, root),
        text: editableElement.textContent || '',
        rect: editableElement.getBoundingClientRect(),
      })
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [active, canEditCurrentPage])

  const closeEditor = useCallback(() => {
    setEditingTarget(null)
  }, [])

  const applyTargetText = useCallback((text: string) => {
    if (!editingTarget) return

    const nextStore = normalizeStore(storeRef.current)
    nextStore.pages[pageKeyRef.current] = {
      ...(nextStore.pages[pageKeyRef.current] || {}),
      [editingTarget.selector]: {
        text,
        updatedAt: new Date().toISOString(),
      },
    }

    setEditingTarget((target) => target ? { ...target, text } : target)
    storeRef.current = nextStore
    hasUnsavedChangesRef.current = true
    setStore(nextStore)
    setHasUnsavedChanges(true)
    setSaveState('dirty')
    closeEditor()
  }, [closeEditor, editingTarget])

  const value = useMemo<ManualEditingContextValue>(() => ({
    active,
    canEditCurrentPage,
    editingTarget,
    hasUnsavedChanges,
    saveState,
    setActive,
    closeEditor,
    applyTargetText,
    commitManualEdits,
  }), [
    active,
    applyTargetText,
    canEditCurrentPage,
    closeEditor,
    commitManualEdits,
    editingTarget,
    hasUnsavedChanges,
    saveState,
    setActive,
  ])

  return (
    <ManualEditingContext.Provider value={value}>
      {children}
    </ManualEditingContext.Provider>
  )
}
