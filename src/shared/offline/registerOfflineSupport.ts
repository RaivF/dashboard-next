import { OFFLINE_CACHE_URLS, warmOfflineResources } from './offlineResources.js'

function postWarmCacheMessage(registration: ServiceWorkerRegistration) {
  const worker = registration.active || registration.waiting || registration.installing
  worker?.postMessage({
    type: 'WARM_OFFLINE_CACHE',
    urls: OFFLINE_CACHE_URLS,
  })
}

export function registerOfflineSupport() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

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
