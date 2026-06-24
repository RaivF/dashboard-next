import { useEffect, useRef, useState } from 'react'
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

const INITIAL_CAMERA = {
  azimuth: 105,
  tilt: 50,
}

const INITIAL_LOCATION = {
  center: [35.37288, 46.842187],
  zoom: 16.9,
}

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
]

let mapLoaderPromise = null

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getMapLoader() {
  if (window.ymaps3) return Promise.resolve(window.ymaps3)
  if (mapLoaderPromise) return mapLoaderPromise

  mapLoaderPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(MAP_SCRIPT_ID)

    if (!script) {
      script = document.createElement('script')
      script.id = MAP_SCRIPT_ID
      script.async = true
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(MAP_API_KEY)}&lang=ru_RU`
      document.head.appendChild(script)
    }

    script.addEventListener('load', () => resolve(window.ymaps3), { once: true })
    script.addEventListener('error', () => {
      mapLoaderPromise = null
      script.remove()
      reject(new Error('Yandex Maps API load failed'))
    }, { once: true })
  })

  return mapLoaderPromise
}

function createFlagElement(point) {
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
  const rootRef = useRef(null)
  const mapRef = useRef(null)
  const [status, setStatus] = useState(MAP_API_KEY ? 'idle' : 'missing-key')
  const [camera, setCamera] = useState(INITIAL_CAMERA)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    if (!MAP_API_KEY) return undefined

    let isMounted = true
    let map = null

    async function initMap() {
      setStatus('loading')

      try {
        const ymaps3 = await getMapLoader()
        await ymaps3.ready
        if (!isMounted || !rootRef.current) return

        const {
          YMap,
          YMapControls,
          YMapDefaultFeaturesLayer,
          YMapDefaultSchemeLayer,
          YMapMarker,
        } = ymaps3

        map = new YMap(
          rootRef.current,
          {
            location: INITIAL_LOCATION,
            camera: {
              azimuth: camera.azimuth * DEG_TO_RAD,
              tilt: camera.tilt * DEG_TO_RAD,
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
          map.addChild(zoomControls)
        } catch (controlError) {
          console.warn('Не удалось загрузить стандартные элементы управления карты:', controlError)
        }

        CAMPUS_POINTS.forEach((point) => {
          const marker = new YMapMarker({ coordinates: point.coordinates }, createFlagElement(point))
          map.addChild(marker)
        })

        mapRef.current = map
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
      } else if (rootRef.current) {
        rootRef.current.innerHTML = ''
      }
    }
  }, [loadAttempt])

  function updateCamera(patch) {
    setCamera((current) => {
      const next = {
        azimuth: patch.azimuth ?? current.azimuth,
        tilt: clamp(patch.tilt ?? current.tilt, 0, 65),
      }

      mapRef.current?.update({
        camera: {
          azimuth: next.azimuth * DEG_TO_RAD,
          tilt: next.tilt * DEG_TO_RAD,
          duration: 260,
        },
      })

      return next
    })
  }

  function focusPoint(point) {
    mapRef.current?.setLocation({
      center: point.coordinates,
      zoom: 18,
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
            <span className="campus-map__list-icon" style={{ '--flag-accent': point.accent }}>
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
