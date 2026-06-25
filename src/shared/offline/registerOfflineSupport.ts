const OFFLINE_CACHE_URLS = [
  '/api/report-2025-2026',
  '/api/applicants-statistics',
  '/api/applicants-statistics?period=2025-01',
  '/api/applicants-statistics?period=2026-01',
  '/specialties.mxl',
  '/assets/plan_melgu.webp',
  '/assets/plan_melgu.pdf',
]

async function warmLazyBundles() {
  await Promise.allSettled([
    import('../../pages/campus-plan/ui/CampusPlanPage.js'),
    import('../../pages/campus-map/ui/CampusMapPage.js'),
  ])
}

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
        await warmLazyBundles()
      })
      .catch((error: unknown) => {
        console.warn('Offline cache registration failed:', error)
      })
  })
}
