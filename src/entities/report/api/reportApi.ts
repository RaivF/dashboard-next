import { apiGet } from '../../../shared/api/httpClient.js'

export async function getReport20252026(signal?: AbortSignal): Promise<unknown> {
  return apiGet('/api/report-2025-2026', {
    params: {
      _: Date.now(),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    signal,
    timeout: 20000,
  })
}
