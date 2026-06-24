import { useEffect, useState } from 'react'
import { parseSpecialtiesMxl } from '../lib/specialties.js'

export function useSpecialties() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadSpecialties() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/specialties.mxl', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const buffer = await response.arrayBuffer()
        setRows(parseSpecialtiesMxl(buffer))
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Не удалось загрузить таблицу')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadSpecialties()

    return () => controller.abort()
  }, [])

  return {
    rows,
    loading,
    error,
  }
}
