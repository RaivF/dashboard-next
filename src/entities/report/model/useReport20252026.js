import { useEffect, useState } from 'react'
import { getReport20252026 } from '../api/reportApi.js'

export function useReport20252026() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadReport() {
      setLoading(true)
      setError('')

      try {
        setReport(await getReport20252026(controller.signal))
      } catch (loadError) {
        if (loadError.name !== 'CanceledError' && loadError.name !== 'AbortError') {
          setError(loadError.message || 'Не удалось загрузить отчёт')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadReport()

    return () => controller.abort()
  }, [])

  return {
    report,
    loading,
    error,
  }
}
