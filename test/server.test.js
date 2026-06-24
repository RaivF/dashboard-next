import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import {
  createApp,
  isCorsOriginAllowed,
  normalizePeriod,
} from '../server/index.js'
import {
  alignCurrentYearStatistics,
  appendPreviousYearData,
  buildFileYearResponse,
} from '../server/previousYearData.js'

function requestJson(baseUrl, path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

describe('server', () => {
  let server
  let baseUrl

  before(async () => {
    const app = createApp({
      CORS_ORIGIN: '*',
    })

    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance))
    })

    const { port } = server.address()
    baseUrl = `http://127.0.0.1:${port}`
  })

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  })

  it('normalizes valid periods and rejects invalid months', () => {
    assert.equal(normalizePeriod('2025'), '2025-01')
    assert.equal(normalizePeriod('2025-07'), '2025-07')
    assert.equal(normalizePeriod(' 2025-12 '), '2025-12')
    assert.equal(normalizePeriod('2025-00'), null)
    assert.equal(normalizePeriod('2025-13'), null)
    assert.equal(normalizePeriod('2025-1'), null)
    assert.equal(normalizePeriod('abc'), null)
  })

  it('uses the local file as the previous-year comparison dataset', () => {
    const currentResponse = {
      applicants_statistics: [{ date: '2025-07-01T00:00:00', quantity: 10 }],
      applicants_quantity: 8,
    }
    const fileResponse = {
      applicants_statistics: [{ date: '2025-07-01T00:00:00', quantity: 7 }],
      applicants_quantity: 6,
    }

    const result = appendPreviousYearData(currentResponse, fileResponse)

    assert.equal(result.applicants_statistics[0].date, '2026-07-01T00:00:00')
    assert.equal(result.previous_year_statistics[0].date, '2025-07-01T00:00:00')
    assert.equal(result.previous_year_applicants_quantity, 6)
    assert.equal(result.meta.previousYearSource, 'file')
    assert.equal(currentResponse.applicants_statistics[0].date, '2025-07-01T00:00:00')
  })

  it('keeps 2025 comparison dates unchanged when the current source returns 2026', () => {
    const result = alignCurrentYearStatistics(
      [{ date: '2026-07-01T00:00:00', quantity: 10 }],
      [{ date: '2025-07-01T00:00:00', quantity: 7 }],
    )

    assert.equal(result[0].date, '2026-07-01T00:00:00')
  })

  it('uses the archive file itself as the current dataset for 2025', () => {
    const fileResponse = {
      applicants_statistics: [{ date: '2025-07-01T00:00:00', quantity: 7 }],
      applicants_quantity: 6,
    }

    const result = buildFileYearResponse(fileResponse, '2025-01')

    assert.deepEqual(result.applicants_statistics, fileResponse.applicants_statistics)
    assert.deepEqual(result.previous_year_statistics, [])
    assert.equal(result.applicants_quantity, 6)
    assert.equal(result.meta.source, 'file')
    assert.equal(result.meta.period, '2025-01')
  })

  it('returns the archive dataset when the dashboard requests 2025', async () => {
    const app = createApp({
      CORS_ORIGIN: '*',
    })
    const archiveServer = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance))
    })

    try {
      const { port } = archiveServer.address()
      const response = await requestJson(`http://127.0.0.1:${port}`, '/api/applicants-statistics?period=2025-01')

      assert.equal(response.status, 200)

      const body = await response.json()
      assert.equal(body.meta.source, 'file')
      assert.equal(body.meta.period, '2025-01')
      assert.ok(body.applicants_statistics.every((item) => String(item.date).startsWith('2025-')))
    } finally {
      await new Promise((resolve, reject) => {
        archiveServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  })

  it('allows local CORS origins by default and rejects arbitrary external origins', () => {
    assert.equal(isCorsOriginAllowed(undefined, {}), true)
    assert.equal(isCorsOriginAllowed('http://localhost:5173', {}), true)
    assert.equal(isCorsOriginAllowed('http://127.0.0.1:5173', {}), true)
    assert.equal(isCorsOriginAllowed('http://evil.example', {}), false)
    assert.equal(isCorsOriginAllowed('http://evil.example', { CORS_ORIGIN: '*' }), true)
    assert.equal(isCorsOriginAllowed('https://dashboard.example', { CORS_ORIGIN: 'https://dashboard.example' }), true)
  })

  it('returns health state and mock statistics', async () => {
    const healthResponse = await requestJson(baseUrl, '/api/health')
    assert.equal(healthResponse.status, 200)

    const health = await healthResponse.json()
    assert.equal(health.ok, true)

    const statisticsResponse = await requestJson(baseUrl, '/api/applicants-statistics')
    assert.equal(statisticsResponse.status, 200)

    const statistics = await statisticsResponse.json()
    assert.equal(statistics.meta.source, 'mock')
    assert.equal(statistics.meta.period, '2025-01')
    assert.ok(statistics.applicants_statistics.length > 3000)
    assert.ok(statistics.previous_year_statistics.length > 3000)
  })

  it('returns report data and a normalized api 404 response', async () => {
    const reportResponse = await requestJson(baseUrl, '/api/report-2025-2026')
    assert.equal(reportResponse.status, 200)

    const report = await reportResponse.json()
    assert.equal(report.admissionCampaign.year, '2025/2026')

    const missingResponse = await requestJson(baseUrl, '/api/not-found')
    assert.equal(missingResponse.status, 404)

    const missing = await missingResponse.json()
    assert.equal(missing.error.message, 'Not found')
  })
})
