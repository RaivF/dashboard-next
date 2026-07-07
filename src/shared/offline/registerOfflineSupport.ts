const CACHE_PREFIX = 'university-dashboard'
const OFFLINE_DB_NAME = 'university-dashboard-offline'
const RELOAD_KEY = 'dashboard-browser-cache-cleanup-reloaded'

function deleteOfflineDatabase(): Promise<void> {
  if (!('indexedDB' in window)) return Promise.resolve()

  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(OFFLINE_DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

async function cleanupBrowserCache() {
  const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : []
  const hadController = 'serviceWorker' in navigator && Boolean(navigator.serviceWorker.controller)

  await Promise.allSettled(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.allSettled(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
        .map((cacheName) => caches.delete(cacheName)),
    )
  }

  await deleteOfflineDatabase()

  return hadController || registrations.length > 0
}

export function registerOfflineSupport() {
  window.addEventListener('load', () => {
    cleanupBrowserCache()
      .then((shouldReload) => {
        if (!shouldReload) {
          sessionStorage.removeItem(RELOAD_KEY)
          return
        }

        if (sessionStorage.getItem(RELOAD_KEY)) return
        sessionStorage.setItem(RELOAD_KEY, '1')
        window.location.reload()
      })
      .catch((error: unknown) => {
        console.warn('Browser cache cleanup failed:', error)
      })
  })
}
