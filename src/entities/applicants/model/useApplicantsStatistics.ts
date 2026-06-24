import { useCallback, useEffect } from 'react'
import { APPLICANTS_AUTO_REFRESH_MS } from './applicantsConfig.js'
import { useApplicantsStatisticsStore } from './applicantsStatisticsStore.js'

export function useApplicantsStatistics(period: string) {
  const response = useApplicantsStatisticsStore((state) => state.response)
  const loading = useApplicantsStatisticsStore((state) => state.loading)
  const error = useApplicantsStatisticsStore((state) => state.error)
  const lastUpdated = useApplicantsStatisticsStore((state) => state.lastUpdated)
  const fetchStatistics = useApplicantsStatisticsStore((state) => state.fetchStatistics)
  const abortStatisticsRequest = useApplicantsStatisticsStore((state) => state.abortStatisticsRequest)

  const fetchData = useCallback(async () => {
    await fetchStatistics(period)
  }, [fetchStatistics, period])

  useEffect(() => {
    fetchData()

    const interval = window.setInterval(fetchData, APPLICANTS_AUTO_REFRESH_MS)
    return () => {
      window.clearInterval(interval)
      abortStatisticsRequest()
    }
  }, [abortStatisticsRequest, fetchData])

  return {
    response,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
  }
}
