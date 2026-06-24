import { useEffect, useState } from 'react'
import { getSpecialtiesMxl } from '../api/specialtiesApi.js'
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
        const buffer = await getSpecialtiesMxl(controller.signal)
        setRows(parseSpecialtiesMxl(buffer))
      } catch (loadError) {
        if (loadError.name !== 'AbortError' && loadError.name !== 'CanceledError') {
          setError(loadError.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‚Р°Р±Р»РёС†Сѓ')
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
