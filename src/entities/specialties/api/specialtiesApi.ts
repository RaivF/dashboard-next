import { cachedApiGetArrayBuffer } from '../../../shared/api/offlineCache.js'

export function getSpecialtiesMxl(signal?: AbortSignal): Promise<ArrayBuffer> {
  return cachedApiGetArrayBuffer('/specialties.mxl', { signal })
}
