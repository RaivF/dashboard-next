import { create } from 'zustand'
import { getApplicantsStatistics } from '../api/applicantsApi.js'
import { formatTime } from '../../../shared/lib/date.js'

let abortController = null

export const useApplicantsStatisticsStore = create((set) => ({
  response: null,
  loading: true,
  error: null,
  lastUpdated: null,
  currentPeriod: null,
  fetchStatistics: async (period) => {
    abortController?.abort()
    const controller = new AbortController()
    abortController = controller
    const isCurrentRequest = () => abortController === controller && !controller.signal.aborted

    set({ loading: true, error: null, currentPeriod: period })

    try {
      const data = await getApplicantsStatistics(period, controller.signal)
      if (!isCurrentRequest()) return

      set({
        response: data,
        lastUpdated: formatTime(new Date()),
      })
    } catch (requestError) {
      if (isCurrentRequest() && requestError.name !== 'CanceledError') {
        set({
          error: {
            message:
              requestError.response?.data?.message ||
              requestError.message ||
              'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РґР°РЅРЅС‹С…',
            status: requestError.response?.status,
          },
        })
      }
    } finally {
      if (isCurrentRequest()) {
        set({ loading: false })
      }
    }
  },
  abortStatisticsRequest: () => {
    abortController?.abort()
  },
}))
