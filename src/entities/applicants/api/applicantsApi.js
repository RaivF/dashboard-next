import { httpClient } from '../../../shared/api/httpClient.js'

export async function getApplicantsStatistics(period, signal) {
  const response = await httpClient.get('/api/applicants-statistics', {
    params: period ? { period } : undefined,
    signal,
    timeout: 45000,
  })

  return response.data
}
