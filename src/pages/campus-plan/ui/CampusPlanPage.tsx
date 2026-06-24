import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import {
  Download,
  Fullscreen,
  Hand,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Undo2,
} from 'lucide-react'

const PDF_URL = '/assets/plan_melgu.pdf'
const MAP_IMAGE_URL = '/assets/plan_melgu.webp'
const MAP_SIZE = { width: 3370, height: 2384 }
const MIN_ZOOM = 0.12
const MAX_ZOOM = 2.5
const ZOOM_STEP = 1.18
const DRAWING_SESSION_KEY = 'campus-plan-drawing'
const DRAW_COLORS = [
  { value: '#ef4444', label: 'Красный' },
  { value: '#2563eb', label: 'Синий' },
  { value: '#16a34a', label: 'Зелёный' },
  { value: '#7c3aed', label: 'Фиолетовый' },
  { value: '#111827', label: 'Чёрный' },
]

type MapPoint = {
  x: number
  y: number
}

type DrawingStroke = {
  id: string
  color: string
  points: MapPoint[]
}

type DrawingMode = 'pan' | 'draw'

type PendingFocus =
  | {
      reset: true
    }
  | {
      reset?: false
      xRatio: number
      yRatio: number
      viewerX: number
      viewerY: number
    }

type DragState = {
  x: number
  y: number
  scrollLeft: number
  scrollTop: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isMapPoint(point: unknown): point is MapPoint {
  return (
    typeof point === 'object'
    && point !== null
    && Number.isFinite((point as MapPoint).x)
    && Number.isFinite((point as MapPoint).y)
  )
}

function loadSessionStrokes(): DrawingStroke[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(DRAWING_SESSION_KEY) || '[]')
    if (!Array.isArray(saved)) return []

    return saved
      .filter((stroke): stroke is { id: unknown; color: unknown; points: unknown[] } => (
        typeof stroke === 'object'
        && stroke !== null
        && Array.isArray((stroke as { points?: unknown }).points)
      ))
      .map((stroke) => ({
        id: String(stroke.id),
        color: DRAW_COLORS.some((color) => color.value === stroke.color)
          ? String(stroke.color)
          : DRAW_COLORS[0].value,
        points: stroke.points.filter(isMapPoint),
      }))
      .filter((stroke) => stroke.points.length > 0)
  } catch {
    return []
  }
}

function pointsToPath(points: MapPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
}

export default function CampusPlanPage() {
  const viewerRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef(1)
  const pendingFocusRef = useRef<PendingFocus | null>(null)
  const initialFitRef = useRef(false)
  const dragRef = useRef<DragState | null>(null)
  const drawRef = useRef<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [error, setError] = useState('')
  const [interactionMode, setInteractionMode] = useState<DrawingMode>('pan')
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0].value)
  const [strokes, setStrokes] = useState<DrawingStroke[]>(loadSessionStrokes)

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAWING_SESSION_KEY, JSON.stringify(strokes))
    } catch (storageError) {
      console.warn('Не удалось сохранить рисунок в сессии:', storageError)
    }
  }, [strokes])

  const applyZoom = useCallback((nextZoom: number, focusPoint?: MapPoint) => {
    const normalizedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    if (Math.abs(normalizedZoom - zoomRef.current) < 0.001) return

    if (focusPoint && viewerRef.current && pageRef.current) {
      const viewerRect = viewerRef.current.getBoundingClientRect()
      const pageRect = pageRef.current.getBoundingClientRect()
      pendingFocusRef.current = {
        xRatio: clamp((focusPoint.x - pageRect.left) / pageRect.width, 0, 1),
        yRatio: clamp((focusPoint.y - pageRect.top) / pageRect.height, 0, 1),
        viewerX: focusPoint.x - viewerRect.left,
        viewerY: focusPoint.y - viewerRect.top,
      }
    }

    zoomRef.current = normalizedZoom
    setZoom(normalizedZoom)
  }, [])

  const fitPlan = useCallback((mode: 'screen' | 'width' = 'screen') => {
    const viewer = viewerRef.current
    if (!viewer) return

    const horizontalPadding = 48
    const verticalPadding = 48
    const widthScale = (viewer.clientWidth - horizontalPadding) / MAP_SIZE.width
    const heightScale = (viewer.clientHeight - verticalPadding) / MAP_SIZE.height
    const nextZoom = mode === 'width' ? widthScale : Math.min(widthScale, heightScale)

    const normalizedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    if (Math.abs(normalizedZoom - zoomRef.current) < 0.001) {
      pendingFocusRef.current = null
      viewer.scrollTo({ left: 0, top: 0 })
      return
    }

    pendingFocusRef.current = { reset: true }
    applyZoom(normalizedZoom)
  }, [applyZoom])

  useLayoutEffect(() => {
    if (initialFitRef.current) return
    initialFitRef.current = true
    fitPlan('screen')
  }, [fitPlan])

  useLayoutEffect(() => {
    const focus = pendingFocusRef.current
    const viewer = viewerRef.current
    const pageElement = pageRef.current
    if (!focus || !viewer || !pageElement) return

    if (focus.reset) {
      viewer.scrollTo({ left: 0, top: 0 })
    } else {
      viewer.scrollLeft = pageElement.offsetLeft + focus.xRatio * MAP_SIZE.width * zoom - focus.viewerX
      viewer.scrollTop = pageElement.offsetTop + focus.yRatio * MAP_SIZE.height * zoom - focus.viewerY
    }

    pendingFocusRef.current = null
  }, [zoom])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return undefined

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      const factor = Math.exp(-event.deltaY * 0.0015)
      applyZoom(zoomRef.current * factor, { x: event.clientX, y: event.clientY })
    }

    viewer.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewer.removeEventListener('wheel', handleWheel)
  }, [applyZoom])

  function zoomFromCenter(factor: number) {
    const rect = viewerRef.current?.getBoundingClientRect()
    if (!rect) return
    applyZoom(zoomRef.current * factor, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const viewer = viewerRef.current
    if (!viewer) return

    if (interactionMode === 'draw') {
      const point = getMapPoint(event)
      if (!point) return
      event.preventDefault()
      viewer.setPointerCapture(event.pointerId)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      drawRef.current = id
      setStrokes((current) => [...current, { id, color: drawColor, points: [point] }])
      return
    }

    viewer.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewer.scrollLeft,
      scrollTop: viewer.scrollTop,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (interactionMode === 'draw' && drawRef.current) {
      const point = getMapPoint(event)
      if (!point) return

      setStrokes((current) => current.map((stroke) => {
        if (stroke.id !== drawRef.current) return stroke
        const previousPoint = stroke.points[stroke.points.length - 1]
        if (Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < 3) {
          return stroke
        }
        return { ...stroke, points: [...stroke.points, point] }
      }))
      return
    }

    const drag = dragRef.current
    const viewer = viewerRef.current
    if (!drag || !viewer) return
    viewer.scrollLeft = drag.scrollLeft - (event.clientX - drag.x)
    viewer.scrollTop = drag.scrollTop - (event.clientY - drag.y)
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (viewerRef.current?.hasPointerCapture(event.pointerId)) {
      viewerRef.current.releasePointerCapture(event.pointerId)
    }
    drawRef.current = null
    dragRef.current = null
    setIsDragging(false)
  }

  function getMapPoint(event: ReactPointerEvent<HTMLDivElement>): MapPoint | null {
    const pageElement = pageRef.current
    if (!pageElement) return null
    const rect = pageElement.getBoundingClientRect()
    if (
      event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom
    ) return null

    return {
      x: ((event.clientX - rect.left) / rect.width) * MAP_SIZE.width,
      y: ((event.clientY - rect.top) / rect.height) * MAP_SIZE.height,
    }
  }

  function toggleDrawingMode() {
    drawRef.current = null
    dragRef.current = null
    setIsDragging(false)
    setInteractionMode((current) => (current === 'draw' ? 'pan' : 'draw'))
  }

  async function toggleFullscreen() {
    const panel = viewerRef.current?.closest('.campus-plan')
    if (!panel) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await panel.requestFullscreen()
  }

  return (
    <section className="campus-plan" aria-label="Просмотр плана университета">
      <div className="campus-plan__toolbar">
        <div className="campus-plan__controls" aria-label="Управление масштабом">
          <button type="button" onClick={() => zoomFromCenter(1 / ZOOM_STEP)} aria-label="Уменьшить">
            <Minus aria-hidden="true" size={20} />
          </button>
          <output className="campus-plan__zoom" aria-live="polite">
            {Math.round(zoom * 100)}%
          </output>
          <button type="button" onClick={() => zoomFromCenter(ZOOM_STEP)} aria-label="Увеличить">
            <Plus aria-hidden="true" size={20} />
          </button>
          <span className="campus-plan__divider" aria-hidden="true" />
          <button
            className={interactionMode === 'draw' ? 'campus-plan__tool--active' : ''}
            type="button"
            onClick={toggleDrawingMode}
            title={interactionMode === 'draw' ? 'Вернуться к перемещению' : 'Рисовать на карте'}
            aria-label={interactionMode === 'draw' ? 'Перейти к перемещению' : 'Включить рисование'}
            aria-pressed={interactionMode === 'draw'}
          >
            {interactionMode === 'draw'
              ? <Hand aria-hidden="true" size={19} />
              : <Pencil aria-hidden="true" size={19} />}
          </button>
          <button type="button" onClick={toggleFullscreen} title="Полный экран" aria-label="Открыть на весь экран">
            <Fullscreen aria-hidden="true" size={19} />
          </button>
          <a href={PDF_URL} download="plan_melgu.pdf" title="Скачать PDF" aria-label="Скачать PDF-файл">
            <Download aria-hidden="true" size={19} />
          </a>
        </div>
      </div>

      <div
        ref={viewerRef}
        className={`campus-plan__viewer${isDragging ? ' campus-plan__viewer--dragging' : ''}${interactionMode === 'draw' ? ' campus-plan__viewer--drawing' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        {interactionMode === 'draw' && (
          <div className="campus-plan__drawing-tools" onPointerDown={(event) => event.stopPropagation()}>
            <span>Цвет линии</span>
            <div className="campus-plan__colors" aria-label="Цвет линии">
              {DRAW_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={drawColor === color.value ? 'campus-plan__color--active' : ''}
                  type="button"
                  style={{ '--draw-color': color.value } as CSSProperties & Record<'--draw-color', string>}
                  onClick={() => setDrawColor(color.value)}
                  aria-label={`Цвет: ${color.label}`}
                  aria-pressed={drawColor === color.value}
                />
              ))}
            </div>
            <span className="campus-plan__drawing-divider" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setStrokes((current) => current.slice(0, -1))}
              disabled={strokes.length === 0}
              title="Отменить последнюю линию"
              aria-label="Отменить последнюю линию"
            >
              <Undo2 aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              onClick={() => setStrokes([])}
              disabled={strokes.length === 0}
              title="Очистить рисунок"
              aria-label="Очистить рисунок"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        )}
        {error && <div className="campus-plan__message campus-plan__message--error">{error}</div>}
        {!error && !imageReady && <div className="campus-plan__message">Загружаем план…</div>}
        <div className="campus-plan__stage">
          <div ref={pageRef} className="campus-plan__page">
            <img
              className={`campus-plan__image${imageReady ? ' campus-plan__image--ready' : ''}`}
              src={MAP_IMAGE_URL}
              alt="План университета"
              width={MAP_SIZE.width}
              height={MAP_SIZE.height}
              style={{
                width: `${MAP_SIZE.width * zoom}px`,
                height: `${MAP_SIZE.height * zoom}px`,
              }}
              draggable="false"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setImageReady(true)}
              onError={() => setError('Не удалось загрузить изображение плана университета.')}
            />
            <svg
              className="campus-plan__drawing-layer"
              viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}
              aria-hidden="true"
              data-stroke-count={strokes.length}
            >
              {strokes.map((stroke) => (
                <path
                  key={stroke.id}
                  d={pointsToPath(stroke.points)}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
