import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

const DEFAULT_TIMEOUT_MS = 20000

function getApiBaseUrl() {
  return import.meta.env?.VITE_API_BASE_URL || ''
}

export type NormalizedHttpError = {
  name: 'HttpError'
  message: string
  status?: number
  response?: AxiosResponse
  cause: unknown
}

export function normalizeHttpError(error: unknown): NormalizedHttpError | unknown {
  if (axios.isCancel(error)) return error

  const axiosError = error as AxiosError<{ message?: string }>
  const status = axiosError.response?.status
  const responseMessage = axiosError.response?.data?.message
  const message = responseMessage || (status ? `HTTP ${status}` : axiosError.message)

  return {
    name: 'HttpError',
    message,
    status,
    response: axiosError.response,
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

export async function apiGet<TResponse = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await httpClient.get<TResponse>(url, config)
  return response.data
}

export async function apiGetArrayBuffer(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ArrayBuffer> {
  const response = await httpClient.get<ArrayBuffer>(url, {
    ...config,
    responseType: 'arraybuffer',
  })

  return response.data
}
