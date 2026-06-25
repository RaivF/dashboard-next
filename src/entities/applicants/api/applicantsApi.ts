import { cachedApiGet } from '../../../shared/api/offlineCache.js'

export async function getApplicantsStatistics(period?: string, signal?: AbortSignal): Promise<unknown> {
  return cachedApiGet('/api/applicants-statistics', {
    params: period ? { period } : undefined,
    signal,
    timeout: 45000,
  })
}
