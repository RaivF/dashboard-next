import axios from 'axios'

const DEFAULT_TIMEOUT_MS = 20000

function getApiBaseUrl() {
  return import.meta.env?.VITE_API_BASE_URL || ''
}

export function normalizeHttpError(error) {
  if (axios.isCancel(error)) return error

  const status = error.response?.status
  const responseMessage = error.response?.data?.message
  const message = responseMessage || (status ? `HTTP ${status}` : error.message)

  return {
    name: 'HttpError',
    message,
    status,
    response: error.response,
    cause: error,
  }
}

export const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: DEFAULT_TIMEOUT_MS,
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeHttpError(error)),
)

export async function apiGet(url, config) {
  const response = await httpClient.get(url, config)
  return response.data
}

export async function apiGetArrayBuffer(url, config) {
  const response = await httpClient.get(url, {
    ...config,
    responseType: 'arraybuffer',
  })

  return response.data
}
