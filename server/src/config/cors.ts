import type { CorsOptions } from 'cors'
import type { ServerEnvironment } from '../types/environment.js'

const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i

export function isCorsOriginAllowed(origin: string | undefined, env: ServerEnvironment = process.env): boolean {
  if (!origin) return true
  if (env.CORS_ORIGIN === '*') return true

  if (env.CORS_ORIGIN) {
    return env.CORS_ORIGIN
      .split(',')
      .map((allowedOrigin) => allowedOrigin.trim())
      .filter(Boolean)
      .includes(origin)
  }

  return LOCAL_ORIGIN_PATTERN.test(origin)
}

export function createCorsOptions(env: ServerEnvironment): CorsOptions {
  return {
    origin(origin, callback) {
      callback(null, isCorsOriginAllowed(origin, env))
    },
  }
}
