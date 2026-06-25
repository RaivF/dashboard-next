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

async function warmLazyOfflinePages() {
  await Promise.allSettled([
    import('../../pages/campus-plan/ui/CampusPlanPage.js'),
  ])
}

async function warmOfflineData() {
  await Promise.allSettled([
    cachedApiGet('/api/applicants-statistics'),
    cachedApiGet('/api/applicants-statistics', { params: { period: '2025-01' }, timeout: 45000 }),
    cachedApiGet('/api/applicants-statistics', { params: { period: '2026-01' }, timeout: 45000 }),
    cachedApiGet('/api/report-2025-2026'),
    cachedApiGetArrayBuffer('/specialties.mxl'),
  ])
}

async function fetchStaticResource(url: string) {
  const response = await fetch(url, {
    cache: 'force-cache',
    credentials: 'same-origin',
  })

  if (!response.ok) throw new Error(`Offline warmup failed: ${url}`)
}

export function warmOfflineResources(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (warmOfflineResourcesPromise) return warmOfflineResourcesPromise

  warmOfflineResourcesPromise = Promise.allSettled([
    warmOfflineData(),
    ...OFFLINE_PAGE_URLS.map((url) => fetchStaticResource(url)),
    ...OFFLINE_ASSET_URLS.map((url) => fetchStaticResource(url)),
    warmLazyOfflinePages(),
  ]).then(() => undefined)

  return warmOfflineResourcesPromise
}
import { cachedApiGet, cachedApiGetArrayBuffer } from '../api/offlineCache.js'
