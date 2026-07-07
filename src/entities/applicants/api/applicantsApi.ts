import { apiGet } from '../../../shared/api/httpClient.js'

export async function getApplicantsStatistics(period?: string, signal?: AbortSignal): Promise<unknown> {
  return apiGet('/api/applicants-statistics', {
    params: {
      ...(period ? { period } : {}),
      _: Date.now(),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    signal,
    timeout: 45000,
  })
}
