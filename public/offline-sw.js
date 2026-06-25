const CACHE_PREFIX = 'university-dashboard'
const APP_CACHE = `${CACHE_PREFIX}-app-v1`
const DATA_CACHE = `${CACHE_PREFIX}-data-v1`
const STATIC_CACHE = `${CACHE_PREFIX}-static-v1`

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/specialties.mxl',
  '/assets/plan_melgu.webp',
  '/assets/plan_melgu.pdf',
]

const WARM_URLS = [
  '/api/report-2025-2026',
  '/api/applicants-statistics',
  '/api/applicants-statistics?period=2025-01',
  '/api/applicants-statistics?period=2026-01',
  ...APP_SHELL_URLS,
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isApiRequest(url) {
  return isSameOrigin(url) && url.pathname.startsWith('/api/')
}

function isStaticRequest(request, url) {
  if (!isSameOrigin(url)) return false
  if (request.destination && request.destination !== 'document') return true
  return url.pathname.startsWith('/assets/') || url.pathname === '/specialties.mxl'
}

function getCacheForRequest(request, url) {
  if (isApiRequest(url)) return DATA_CACHE
  if (isStaticRequest(request, url)) return STATIC_CACHE
  return APP_CACHE
}

async function fetchAndCache(request, cacheName) {
  const response = await fetch(request)

  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }

  return response
}

async function cacheIndexAssets(cache) {
  const indexRequest = new Request('/index.html', { cache: 'reload' })
  const indexResponse = await fetch(indexRequest)

  if (!indexResponse.ok) return

  await cache.put('/index.html', indexResponse.clone())
  await cache.put('/', indexResponse.clone())

  const html = await indexResponse.text()
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/assets/'))

  await Promise.allSettled(
    assetUrls.map((href) => fetchAndCache(new Request(href, { cache: 'reload' }), STATIC_CACHE)),
  )
}

async function warmCache(urls) {
  const uniqueUrls = Array.from(new Set(urls))

  await Promise.allSettled(
    uniqueUrls.map((url) => {
      const request = new Request(url, {
        cache: 'reload',
        credentials: 'same-origin',
      })
      const parsedUrl = new URL(request.url)
      return fetchAndCache(request, getCacheForRequest(request, parsedUrl))
    }),
  )
}

async function staleWhileRevalidate(request) {
  const url = new URL(request.url)
  const cacheName = getCacheForRequest(request, url)
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const networkResponsePromise = fetchAndCache(request, cacheName).catch(() => null)

  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await networkResponsePromise
  if (networkResponse) return networkResponse

  if (request.mode === 'navigate') {
    return cache.match('/index.html')
  }

  return Response.error()
}

async function networkFirstNavigation(request) {
  try {
    return await fetchAndCache(request, APP_CACHE)
  } catch {
    const cache = await caches.open(APP_CACHE)
    return (await cache.match(request)) || (await cache.match('/index.html')) || Response.error()
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const appCache = await caches.open(APP_CACHE)
      await appCache.addAll(APP_SHELL_URLS)
      await cacheIndexAssets(appCache)
      await warmCache(WARM_URLS)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && ![APP_CACHE, DATA_CACHE, STATIC_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'WARM_OFFLINE_CACHE') return
  const urls = Array.isArray(event.data.urls) ? event.data.urls : WARM_URLS
  event.waitUntil(warmCache([...WARM_URLS, ...urls]))
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.headers.has('range')) return

  const url = new URL(request.url)
  if (!isSameOrigin(url)) return
  if (url.pathname === '/offline-sw.js') return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isApiRequest(url) || isStaticRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
