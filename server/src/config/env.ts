import dotenv from 'dotenv'
import type { ServerEnvironment } from '../types/environment.js'

dotenv.config()

export type ServerConfig = {
  env: ServerEnvironment
  isProduction: boolean
  port: number
}

export function getServerConfig(env: ServerEnvironment = process.env): ServerConfig {
  const port = Number(env.PORT || 3001)

  return {
    env,
    isProduction: env.NODE_ENV === 'production',
    port: Number.isFinite(port) && port > 0 ? port : 3001,
  }
}
