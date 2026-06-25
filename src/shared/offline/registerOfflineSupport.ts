import { OFFLINE_CACHE_URLS, warmOfflineResources } from './offlineResources.js'

function postWarmCacheMessage(registration: ServiceWorkerRegistration) {
  const worker = registration.active || registration.waiting || registration.installing
  worker?.postMessage({
    type: 'WARM_OFFLINE_CACHE',
    urls: OFFLINE_CACHE_URLS,
  })
}

async function cleanupDevelopmentOfflineCache() {
  if (!('serviceWorker' in navigator)) return false

  const hadController = Boolean(navigator.serviceWorker.controller)

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.allSettled(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.allSettled(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('university-dashboard'))
        .map((cacheName) => caches.delete(cacheName)),
    )
  }

  return hadController
}

export function registerOfflineSupport() {
  if (!import.meta.env.PROD) {
    window.addEventListener('load', () => {
      cleanupDevelopmentOfflineCache()
        .then((shouldReload) => {
          const reloadKey = 'dashboard-dev-offline-cleanup-reloaded'
          if (!shouldReload) {
            sessionStorage.removeItem(reloadKey)
            return
          }

          if (sessionStorage.getItem(reloadKey)) return
          sessionStorage.setItem(reloadKey, '1')
          window.location.reload()
        })
        .catch((error: unknown) => {
          console.warn('Offline cache cleanup failed:', error)
        })
    })
    return
  }

  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/offline-sw.js')
      .then(async (registration) => {
        postWarmCacheMessage(registration)
        await navigator.serviceWorker.ready
        postWarmCacheMessage(registration)
        await warmOfflineResources()
      })
      .catch((error: unknown) => {
        console.warn('Offline cache registration failed:', error)
      })
  })
}
