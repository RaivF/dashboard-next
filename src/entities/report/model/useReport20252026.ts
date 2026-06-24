import { useEffect, useState } from 'react'
import { getReport20252026 } from '../api/reportApi.js'

type RequestErrorLike = {
  name?: string
  message?: string
}

export function useReport20252026() {
  const [report, setReport] = useState<unknown>(null)
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
        const error = loadError as RequestErrorLike
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          setError(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕС‚С‡С‘С‚')
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
