import path from 'node:path'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createCorsOptions } from './config/cors.js'
import { createApiRouter } from './routes/apiRoutes.js'
import type { ServerEnvironment } from './types/environment.js'
import { distDir } from './utils/paths.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFoundHandler } from './middlewares/notFound.js'

export function createApp(env: ServerEnvironment = process.env) {
  const app = express()

  app.use(
    helmet({
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'wasm-unsafe-eval'", 'https://api-maps.yandex.ru', 'https://yastatic.net'],
          'script-src-elem': ["'self'", 'https://api-maps.yandex.ru', 'https://yastatic.net'],
          'connect-src': [
            "'self'",
            'https://api-maps.yandex.ru',
            'https://yastatic.net',
            'https://*.maps.yandex.net',
            'https://*.yandex.ru',
            'https://*.yandex.net',
          ],
          'img-src': [
            "'self'",
            'data:',
            'https://yastatic.net',
            'https://*.maps.yandex.net',
            'https://*.yandex.ru',
            'https://*.yandex.net',
          ],
          'worker-src': ["'self'", 'blob:'],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cors(createCorsOptions(env)))

  app.use('/api', createApiRouter(env))
  app.use('/api', notFoundHandler)

  if (env.NODE_ENV === 'production') {
    app.use(express.static(distDir))

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)

  return app
}
