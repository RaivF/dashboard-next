export const OFFLINE_DATA_URLS = [
  '/api/applicants-statistics',
  '/api/applicants-statistics?period=2025-01',
  '/api/applicants-statistics?period=2026-01',
  '/api/report-2025-2026',
  '/specialties.mxl',
]

export const OFFLINE_PAGE_URLS = [
  '/',
  '/specialties',
  '/report-2025-2026',
  '/campus-plan',
]

export const OFFLINE_ASSET_URLS = [
  '/assets/plan_melgu.webp',
  '/assets/plan_melgu.pdf',
]

export const OFFLINE_CACHE_URLS = [
  ...OFFLINE_DATA_URLS,
  ...OFFLINE_PAGE_URLS,
  ...OFFLINE_ASSET_URLS,
]

let warmOfflineResourcesPromise: Promise<void> | null = null

async function fetchOfflineResource(url: string) {
  const response = await fetch(url, {
    cache: 'reload',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`Offline warmup failed: ${url}`)
  }
}

async function warmLazyOfflinePages() {
  await Promise.allSettled([
    import('../../pages/campus-plan/ui/CampusPlanPage.js'),
  ])
}

export function warmOfflineResources(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmOfflineResourcesPromise) return warmOfflineResourcesPromise

  warmOfflineResourcesPromise = Promise.allSettled([
    ...OFFLINE_CACHE_URLS.map((url) => fetchOfflineResource(url)),
    warmLazyOfflinePages(),
  ]).then(() => undefined)

  return warmOfflineResourcesPromise
}
