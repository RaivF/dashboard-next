import { useEffect, useState } from 'react'
import { getSpecialtiesMxl } from '../api/specialtiesApi.js'
import { parseSpecialtiesMxl } from '../lib/specialties.js'
import type { SpecialtyRow } from '../lib/specialties.js'

type RequestErrorLike = {
  name?: string
  message?: string
}

export function useSpecialties() {
  const [rows, setRows] = useState<SpecialtyRow[]>([])
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
        const error = loadError as RequestErrorLike
        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
          setError(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С‚Р°Р±Р»РёС†Сѓ')
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
