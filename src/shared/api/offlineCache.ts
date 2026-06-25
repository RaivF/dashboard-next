import type { AxiosRequestConfig } from 'axios'
import { apiGet, apiGetArrayBuffer, httpClient } from './httpClient.js'

const DB_NAME = 'university-dashboard-offline'
const STORE_NAME = 'responses'
const DB_VERSION = 1

type CacheEntry<T> = {
  key: string
  value: T
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function isAbortLikeError(error: unknown): boolean {
  const name = (error as { name?: string })?.name
  return name === 'AbortError' || name === 'CanceledError'
}

function openOfflineCache(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openOfflineCache().then((db) => new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME))

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }))
}

function getCacheKey(url: string, config?: AxiosRequestConfig): string {
  return httpClient.getUri({
    ...config,
    url,
  })
}

async function readCachedValue<T>(key: string): Promise<T | null> {
  try {
    const entry = await transaction<CacheEntry<T> | undefined>('readonly', (store) => store.get(key))
    return entry?.value ?? null
  } catch {
    return null
  }
}

async function writeCachedValue<T>(key: string, value: T): Promise<void> {
  try {
    await transaction('readwrite', (store) => store.put({
      key,
      value,
      updatedAt: Date.now(),
    } satisfies CacheEntry<T>))
  } catch {
    // Cache writes are best-effort: the live request has already succeeded.
  }
}

export async function cachedApiGet<TResponse = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const cacheKey = getCacheKey(url, config)

  try {
    const data = await apiGet<TResponse>(url, config)
    await writeCachedValue(cacheKey, data)
    return data
  } catch (error) {
    if (isAbortLikeError(error)) throw error

    const cached = await readCachedValue<TResponse>(cacheKey)
    if (cached !== null) return cached

    throw error
  }
}

export async function cachedApiGetArrayBuffer(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ArrayBuffer> {
  const cacheKey = getCacheKey(url, {
    ...config,
    responseType: 'arraybuffer',
  })

  try {
    const data = await apiGetArrayBuffer(url, config)
    await writeCachedValue(cacheKey, data)
    return data
  } catch (error) {
    if (isAbortLikeError(error)) throw error

    const cached = await readCachedValue<ArrayBuffer>(cacheKey)
    if (cached) return cached

    throw error
  }
}
