import { useEffect, useState } from 'react'
import {
  getCompetitionGroupsDemand,
  type CompetitionGroupsDemand,
} from '../api/competitionGroupsDemandApi.js'

const AUTO_REFRESH_MS = 120_000

type DemandState = {
  data: CompetitionGroupsDemand | null
  error: string | null
  loading: boolean
}

export function useCompetitionGroupsDemand(campaignYear: number): DemandState {
  const [state, setState] = useState<DemandState>({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const data = await getCompetitionGroupsDemand(campaignYear, controller.signal)
        setState({ data, error: null, loading: false })
      } catch (error) {
        if (controller.signal.aborted) return

        setState((previous) => ({
          data: previous.data,
          error: error instanceof Error ? error.message : 'Не удалось загрузить данные КЦП',
          loading: false,
        }))
      }
    }

    void load()
    const interval = window.setInterval(load, AUTO_REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [campaignYear])

  return state
}
