import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { buildMockResponse } from './mockData.js'
import { buildReport20252026Response } from './reportData.js'
import { loadExcelApplicantsData } from './excelApplicantsData.js'
import {
  appendPreviousYearData,
  buildFileYearResponse,
  loadPreviousYearData,
} from './previousYearData.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

const PORT = Number(process.env.PORT || 3001)
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i

export function normalizePeriod(period) {
  if (!period) return null
  const value = String(period).trim()
  const match = value.match(/^(\d{4})(?:-(\d{2}))?$/)
  if (!match) return null

  const year = match[1]
  const month = match[2] || '01'
  const monthNumber = Number(month)

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null
  }

  return `${year}-${month}`
}

export function isCorsOriginAllowed(origin, env = process.env) {
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

export function createApp(env = process.env) {
  const app = express()

  app.use(express.json({ limit: '1mb' }))

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isCorsOriginAllowed(origin, env))
      },
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'university-dashboard',
    })
  })

  app.get('/api/report-2025-2026', (_req, res) => {
    res.json(buildReport20252026Response())
  })

  app.get('/api/applicants-statistics', async (req, res) => {
    const selectedPeriod = normalizePeriod(req.query.period)
    const selectedYear = selectedPeriod ? Number(selectedPeriod.slice(0, 4)) : null

    if (selectedYear === 2025) {
      const previousYearData = loadPreviousYearData(rootDir, env)
      return res.json(buildFileYearResponse(previousYearData, selectedPeriod))
    }

    const excelApplicantsData = loadExcelApplicantsData(rootDir, env)

    if (excelApplicantsData) {
      const previousYearData = loadPreviousYearData(rootDir, env)
      return res.json(appendPreviousYearData(excelApplicantsData, previousYearData))
    }

    return res.json(buildMockResponse(selectedPeriod || undefined))
  })

  if (env.NODE_ENV === 'production') {
    app.use(express.static(distDir))

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  return app
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp()

  app.listen(PORT, () => {
    console.log(`Backend started: http://localhost:${PORT}`)
    console.log('Data source: local files or mock/demo')
  })
}
