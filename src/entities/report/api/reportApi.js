import { apiGet } from '../../../shared/api/httpClient.js'

export async function getReport20252026(signal) {
  return apiGet('/api/report-2025-2026', {
    signal,
    timeout: 20000,
  })
}
