import { apiGetArrayBuffer } from '../../../shared/api/httpClient.js'

export function getSpecialtiesMxl(signal?: AbortSignal): Promise<ArrayBuffer> {
  return apiGetArrayBuffer('/specialties.mxl', { signal })
}
