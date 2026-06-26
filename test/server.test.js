import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
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

  it('returns health state and manual dashboard statistics', async () => {
    const healthResponse = await requestJson(baseUrl, '/api/health')
    assert.equal(healthResponse.status, 200)

    const health = await healthResponse.json()
    assert.equal(health.ok, true)

    const statisticsResponse = await requestJson(baseUrl, '/api/applicants-statistics')
    assert.equal(statisticsResponse.status, 200)

    const statistics = await statisticsResponse.json()
    assert.equal(statistics.meta.source, 'manual-xlsx')
    assert.equal(statistics.meta.manualFile, 'manual-dashboard-data.xlsx')
    assert.equal(statistics.meta.manualPreviousYearFile, 'manual-dashboard-data-2025.xlsx')
    assert.deepEqual(statistics.applicants_statistics, [])
    assert.deepEqual(statistics.previous_year_statistics, [])
    assert.equal(statistics.manual_applicants_by_date.length, 7)
    assert.equal(statistics.manual_applicants_by_date[0].date, '2026-06-20')
    assert.equal(statistics.manual_applicants_by_date[0].quantity, 132)
    assert.equal(statistics.manual_applicants_by_date[1].date, '2026-06-21')
    assert.equal(statistics.manual_applicants_by_date[1].quantity, 0)
    assert.equal(statistics.manual_applicants_by_date.at(-1).date, '2026-06-26')
    assert.equal(statistics.manual_applicants_by_date.at(-1).quantity, 0)
    assert.equal(statistics.manual_funding_by_date.length, 7)
    assert.equal(statistics.manual_funding_by_date[0].categories[0].name, 'Бюджетная основа')
    assert.equal(statistics.manual_funding_by_date[0].categories[0].quantity, 121)
    assert.equal(statistics.manual_funding_by_date[0].categories[1].name, 'Платное обучение')
    assert.equal(statistics.manual_funding_by_date[0].categories[1].quantity, 11)
    assert.equal(statistics.manual_summary.applicationsTotal, 2603)
    assert.equal(statistics.manual_summary.onlineChannels, 287)
    assert.equal(statistics.manual_method[0].name, 'Онлайн')
    assert.equal(statistics.manual_method[0].quantity, 287)
    assert.equal(statistics.manual_method[1].name, 'Очно / через вуз')
    assert.equal(statistics.manual_method[1].quantity, 2316)
    assert.equal(statistics.manual_top_specialties[0].name, 'Юриспруденция')
    assert.equal(statistics.manual_top_specialties[0].quantity, 323)
    assert.equal(statistics.manual_bottom_specialties[0].name, 'Технологические машины и оборудование')
    assert.equal(statistics.manual_bottom_specialties[0].quantity, 1)
    assert.equal(statistics.manual_previous_year_applicants_by_date.length, 6)
    assert.equal(statistics.manual_previous_year_applicants_by_date[0].date, '2025-06-20')
    assert.equal(statistics.manual_previous_year_applicants_by_date[0].quantity, 196)
    assert.equal(statistics.manual_previous_year_applicants_by_date[2].date, '2025-06-22')
    assert.equal(statistics.manual_previous_year_applicants_by_date[2].quantity, 0)
    assert.equal(statistics.manual_previous_year_funding_by_date.length, 6)
    assert.equal(statistics.manual_previous_year_funding_by_date[0].categories[0].quantity, 175)
    assert.equal(statistics.manual_previous_year_funding_by_date[0].categories[1].quantity, 21)
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

  it('persists manual page edits through the api', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'dashboard-manual-edits-'))
    const manualEditsFile = path.join(tempDir, 'edits.json')
    const app = createApp({
      CORS_ORIGIN: '*',
      MANUAL_EDITS_FILE: manualEditsFile,
    })
    const manualEditsServer = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance))
    })

    try {
      const { port } = manualEditsServer.address()
      const manualEditsBaseUrl = `http://127.0.0.1:${port}`

      const emptyResponse = await requestJson(manualEditsBaseUrl, '/api/manual-edits')
      assert.equal(emptyResponse.status, 200)
      assert.deepEqual(await emptyResponse.json(), { version: 1, pages: {} })

      const nextStore = {
        version: 1,
        pages: {
          '/': {
            'section:nth-of-type(1) > strong:nth-of-type(1)': {
              text: '12345',
              updatedAt: '2026-06-26T00:00:00.000Z',
            },
          },
        },
      }
      const saveResponse = await requestJson(manualEditsBaseUrl, '/api/manual-edits', {
        method: 'PUT',
        body: JSON.stringify(nextStore),
      })
      assert.equal(saveResponse.status, 200)
      assert.deepEqual(await saveResponse.json(), nextStore)

      const savedResponse = await requestJson(manualEditsBaseUrl, '/api/manual-edits')
      assert.equal(savedResponse.status, 200)
      assert.deepEqual(await savedResponse.json(), nextStore)
    } finally {
      await new Promise((resolve, reject) => {
        manualEditsServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
