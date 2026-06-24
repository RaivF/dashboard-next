import { httpClient } from '../../../shared/api/httpClient.js'

export async function getReport20252026(signal) {
  const response = await httpClient.get('/api/report-2025-2026', {
    signal,
    timeout: 20000,
  })

  return response.data
}
