import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Building2,
  Compass,
  Expand,
  LocateFixed,
  RotateCcw,
  RotateCw,
  Triangle,
} from 'lucide-react'

const MAP_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || ''
const MAP_SCRIPT_ID = 'yandex-maps-v3-script'
const DEG_TO_RAD = Math.PI / 180
const MAX_CAMERA_TILT = 50
const CAMERA_ANIMATION_MS = 220

const INITIAL_CAMERA = {
  azimuth: 118,
  tilt: MAX_CAMERA_TILT,
}

const INITIAL_LOCATION = {
  center: [35.37318, 46.84212],
  zoom: 18.35,
} satisfies { center: Coordinates; zoom: number }

const CAMPUS_POINTS = [
  {
    id: 'main',
    title: 'Главный корпус',
    caption: 'центр кампуса',
    coordinates: [35.37288, 46.842187],
    accent: '#ef4444',
  },
  {
    id: 'admission',
    title: 'Приёмная комиссия',
    caption: 'входная группа',
    coordinates: [35.37082, 46.84264],
    accent: '#2563eb',
  },
  {
    id: 'library',
    title: 'Библиотека',
    caption: 'учебный корпус',
    coordinates: [35.37464, 46.84274],
    accent: '#16a34a',
  },
  {
    id: 'sport',
    title: 'Спорткомплекс',
    caption: 'площадка',
    coordinates: [35.37576, 46.84143],
    accent: '#f59e0b',
  },
  {
    id: 'dormitory',
    title: 'Общежитие',
    caption: 'студенческий блок',
    coordinates: [35.36965, 46.84136],
    accent: '#7c3aed',
  },
] satisfies CampusPoint[]

type Coordinates = [number, number]

type CameraState = {
  azimuth: number
  tilt: number
}

type CameraPatch = Partial<CameraState>

type CampusMapStatus = 'idle' | 'missing-key' | 'loading' | 'ready' | 'error'

type CampusPoint = {
  id: string
  title: string
  caption: string
  coordinates: Coordinates
  accent: string
}

type YMapInstance = {
  addChild: (child: unknown) => void
  destroy?: () => void
  setLocation: (location: { center: Coordinates; zoom: number; duration: number }) => void
  update: (options: { camera: { azimuth?: number; tilt?: number; duration?: number } }) => void
}

type YMapControlsInstance = {
  addChild: (child: unknown) => void
}

type YMaps3Api = {
  ready: Promise<void>
  import: (moduleName: string) => Promise<{
    YMapZoomControl: new (options: Record<string, never>) => unknown
  }>
  YMap: new (
    root: HTMLElement,
    options: {
      location: typeof INITIAL_LOCATION
      camera: { azimuth: number; tilt: number }
      showScaleInCopyrights: boolean
      theme: 'light'
    },
    children: unknown[],
  ) => YMapInstance
  YMapControls: new (options: { position: 'right' }) => YMapControlsInstance
  YMapDefaultFeaturesLayer: new (options: Record<string, never>) => unknown
  YMapDefaultSchemeLayer: new (options: Record<string, never>) => unknown
  YMapMarker: new (options: { coordinates: Coordinates }, element: HTMLElement) => unknown
}

declare global {
  interface Window {
    ymaps3?: YMaps3Api
  }
}

let mapLoaderPromise: Promise<YMaps3Api> | null = null

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeAzimuth(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180
  return normalized === -180 ? 180 : normalized
}

function hasCameraPatchValue(patch: CameraPatch, key: keyof CameraState): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

function getCameraAnimationDuration(patch: CameraPatch): number {
  return hasCameraPatchValue(patch, 'azimuth') ? 0 : CAMERA_ANIMATION_MS
}

function getMapLoader(): Promise<YMaps3Api> {
  if (window.ymaps3) return Promise.resolve(window.ymaps3)
  if (mapLoaderPromise) return mapLoaderPromise

  mapLoaderPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.id = MAP_SCRIPT_ID
      script.async = true
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(MAP_API_KEY)}&lang=ru_RU`
      document.head.appendChild(script)
    }

    script.addEventListener('load', () => {
      if (window.ymaps3) resolve(window.ymaps3)
      else reject(new Error('Yandex Maps API did not initialize'))
    }, { once: true })
    script.addEventListener('error', () => {
      mapLoaderPromise = null
      script?.remove()
      reject(new Error('Yandex Maps API load failed'))
    }, { once: true })
  })

  return mapLoaderPromise
}

function createFlagElement(point: CampusPoint): HTMLButtonElement {
  const marker = document.createElement('button')
  marker.className = 'campus-map__flag'
  marker.type = 'button'
  marker.style.setProperty('--flag-accent', point.accent)
  marker.innerHTML = `
    <span class="campus-map__flag-pin" aria-hidden="true"></span>
    <span class="campus-map__flag-label">
      <strong>${point.title}</strong>
      <small>${point.caption}</small>
    </span>
  `
  marker.setAttribute('aria-label', point.title)
  return marker
}

export default function CampusMapPage() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<YMapInstance | null>(null)
  const cameraRef = useRef<CameraState>(INITIAL_CAMERA)
  const [status, setStatus] = useState<CampusMapStatus>(MAP_API_KEY ? 'idle' : 'missing-key')
  const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    cameraRef.current = camera
  }, [camera])

  useEffect(() => {
    if (!MAP_API_KEY) return undefined

    let isMounted = true
    let map: YMapInstance | null = null
    const rootElement = rootRef.current

    async function initMap() {
      setStatus('loading')

      try {
        const ymaps3 = await getMapLoader()
        await ymaps3.ready
        if (!isMounted || !rootElement) return

        const {
          YMap,
          YMapControls,
          YMapDefaultFeaturesLayer,
          YMapDefaultSchemeLayer,
          YMapMarker,
        } = ymaps3

        const yMap = new YMap(
          rootElement,
          {
            location: INITIAL_LOCATION,
            camera: {
              azimuth: cameraRef.current.azimuth * DEG_TO_RAD,
              tilt: cameraRef.current.tilt * DEG_TO_RAD,
            },
            showScaleInCopyrights: true,
            theme: 'light',
          },
          [
            new YMapDefaultSchemeLayer({}),
            new YMapDefaultFeaturesLayer({}),
          ],
        )

        try {
          const { YMapZoomControl } = await ymaps3.import('@yandex/ymaps3-default-ui-theme')
          const zoomControls = new YMapControls({ position: 'right' })
          zoomControls.addChild(new YMapZoomControl({}))
          yMap.addChild(zoomControls)
        } catch (controlError) {
          console.warn('Не удалось загрузить стандартные элементы управления карты:', controlError)
        }

        CAMPUS_POINTS.forEach((point) => {
          const marker = new YMapMarker({ coordinates: point.coordinates }, createFlagElement(point))
          yMap.addChild(marker)
        })

        map = yMap
        mapRef.current = yMap
        if (isMounted) setStatus('ready')
      } catch (mapError) {
        console.error('Не удалось открыть 3D-карту:', mapError)
        if (isMounted) setStatus('error')
      }
    }

    initMap()

    return () => {
      isMounted = false
      mapRef.current = null

      if (map?.destroy) {
        map.destroy()
      } else if (rootElement) {
        rootElement.innerHTML = ''
      }
    }
  }, [loadAttempt])

  function updateCamera(patch: CameraPatch) {
    setCamera((current) => {
      const next = {
        azimuth: normalizeAzimuth(patch.azimuth ?? current.azimuth),
        tilt: clamp(patch.tilt ?? current.tilt, 0, MAX_CAMERA_TILT),
      }
      const duration = getCameraAnimationDuration(patch)
      const cameraUpdate: { azimuth?: number; tilt?: number; duration?: number } = {
        duration,
      }

      if (hasCameraPatchValue(patch, 'azimuth')) {
        cameraUpdate.azimuth = next.azimuth * DEG_TO_RAD
      }

      if (hasCameraPatchValue(patch, 'tilt')) {
        cameraUpdate.tilt = next.tilt * DEG_TO_RAD
      }

      cameraRef.current = next

      mapRef.current?.update({
        camera: cameraUpdate,
      })

      return next
    })
  }

  function focusPoint(point: CampusPoint) {
    mapRef.current?.setLocation({
      center: point.coordinates,
      zoom: 18.65,
      duration: 380,
    })
  }

  async function openFullscreen() {
    const element = rootRef.current?.closest('.campus-map')
    if (!element) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await element.requestFullscreen()
    }
  }

  return (
    <section className="campus-map" aria-label="3D-карта кампуса">
      <div className="campus-map__surface">
        <div ref={rootRef} className="campus-map__canvas" />

        {status !== 'ready' && (
          <div className={`campus-map__state campus-map__state--${status}`}>
            {status === 'missing-key' && (
              <>
                <strong>Нужен ключ Яндекс Maps API</strong>
                <span>Добавьте `VITE_YANDEX_MAPS_API_KEY` в `.env`, затем перезапустите приложение.</span>
              </>
            )}
            {status === 'loading' && <strong>Открываем 3D-карту...</strong>}
            {status === 'error' && (
              <>
                <strong>Карта не загрузилась</strong>
                <span>Проверьте ключ API, ограничения HTTP Referer и доступ к `api-maps.yandex.ru`.</span>
                <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                  Повторить
                </button>
              </>
            )}
          </div>
        )}

        <div className="campus-map__tools" aria-label="Управление камерой">
          <button type="button" onClick={() => updateCamera({ azimuth: camera.azimuth - 30 })} title="Повернуть влево" aria-label="Повернуть карту влево">
            <RotateCcw aria-hidden="true" size={19} />
          </button>
          <button type="button" onClick={() => updateCamera({ azimuth: camera.azimuth + 30 })} title="Повернуть вправо" aria-label="Повернуть карту вправо">
            <RotateCw aria-hidden="true" size={19} />
          </button>
          <button type="button" onClick={() => updateCamera({ tilt: camera.tilt + 10 })} title="Увеличить наклон" aria-label="Увеличить наклон карты">
            <Triangle aria-hidden="true" size={18} />
          </button>
          <button type="button" onClick={() => updateCamera({ tilt: camera.tilt - 10 })} title="Уменьшить наклон" aria-label="Уменьшить наклон карты">
            <Triangle aria-hidden="true" className="campus-map__tilt-down" size={18} />
          </button>
          <button type="button" onClick={() => updateCamera(INITIAL_CAMERA)} title="Сбросить камеру" aria-label="Сбросить положение камеры">
            <Compass aria-hidden="true" size={19} />
          </button>
          <button type="button" onClick={openFullscreen} title="Полный экран" aria-label="Открыть карту на весь экран">
            <Expand aria-hidden="true" size={19} />
          </button>
        </div>
      </div>

      <aside className="campus-map__list" aria-label="Отмеченные здания">
        {CAMPUS_POINTS.map((point) => (
          <button key={point.id} type="button" onClick={() => focusPoint(point)}>
            <span
              className="campus-map__list-icon"
              style={{ '--flag-accent': point.accent } as CSSProperties & Record<'--flag-accent', string>}
            >
              <Building2 aria-hidden="true" size={18} />
            </span>
            <span>
              <strong>{point.title}</strong>
              <small>{point.caption}</small>
            </span>
            <LocateFixed aria-hidden="true" size={18} />
          </button>
        ))}
      </aside>
    </section>
  )
}
