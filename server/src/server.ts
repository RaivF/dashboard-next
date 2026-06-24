import { pathToFileURL } from 'node:url'
import { createApp } from './app.js'
import { getServerConfig } from './config/env.js'

export function startServer() {
  const config = getServerConfig()
  const app = createApp(config.env)

  return app.listen(config.port, () => {
    console.log(`Backend started: http://localhost:${config.port}`)
    console.log('Data source: local files or mock/demo')
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer()
}
