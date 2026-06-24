import { create } from 'zustand'
import { getApplicantsStatistics } from '../api/applicantsApi.js'
import { formatTime } from '../../../shared/lib/date.js'

type ApplicantsStatisticsError = {
  message: string
  status?: number
}

type ApplicantsStatisticsState = {
  response: unknown
  loading: boolean
  error: ApplicantsStatisticsError | null
  lastUpdated: string | null
  currentPeriod: string | null
  fetchStatistics: (period: string) => Promise<void>
  abortStatisticsRequest: () => void
}

type RequestErrorLike = {
  name?: string
  message?: string
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

let abortController: AbortController | null = null

export const useApplicantsStatisticsStore = create<ApplicantsStatisticsState>((set) => ({
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
      const error = requestError as RequestErrorLike
      if (isCurrentRequest() && error.name !== 'CanceledError') {
        set({
          error: {
            message:
              error.response?.data?.message ||
              error.message ||
              'Р С›РЎв‚¬Р С‘Р В±Р С”Р В° Р В·Р В°Р С–РЎР‚РЎС“Р В·Р С”Р С‘ Р Т‘Р В°Р Р…Р Р…РЎвЂ№РЎвЂ¦',
            status: error.response?.status,
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
