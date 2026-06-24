import { apiGetArrayBuffer } from '../../../shared/api/httpClient.js'

export function getSpecialtiesMxl(signal) {
  return apiGetArrayBuffer('/specialties.mxl', { signal })
}
