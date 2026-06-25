import { cachedApiGet } from '../../../shared/api/offlineCache.js'

export async function getReport20252026(signal?: AbortSignal): Promise<unknown> {
  return cachedApiGet('/api/report-2025-2026', {
    signal,
    timeout: 20000,
  })
}
