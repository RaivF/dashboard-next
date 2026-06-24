import { pathToFileURL } from 'node:url'
import { createApp } from './src/app.js'
import { isCorsOriginAllowed } from './src/config/cors.js'
import { startServer } from './src/server.js'
import { normalizePeriod } from './src/validators/period.js'

export {
  createApp,
  isCorsOriginAllowed,
  normalizePeriod,
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer()
}
