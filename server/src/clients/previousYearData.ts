// @ts-nocheck
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_PREVIOUS_YEAR_FILE = 'previous-year-data.txt'
const cache = new Map()

function getItemYear(item) {
  const match = String(item?.date || '').match(/^(\d{4})-/)
  return match ? Number(match[1]) : null
}

function getLatestYear(items) {
  return items.reduce((latest, item) => {
    const year = getItemYear(item)
    return Number.isFinite(year) ? Math.max(latest, year) : latest
  }, 0)
}

function shiftItemYear(item, offset) {
  if (!offset || !item?.date) return item

  const shiftedDate = String(item.date).replace(/^(\d{4})-/, (_match, year) => `${Number(year) + offset}-`)
  return shiftedDate === item.date ? item : { ...item, date: shiftedDate }
}

/**
 * The local file is the fixed 2025 comparison dataset. If the current source
 * contains a legacy fixture year, shift it to the following campaign.
 */
export function alignCurrentYearStatistics(currentItems = [], previousItems = []) {
  const currentYear = getLatestYear(currentItems)
  const previousYear = getLatestYear(previousItems)

  if (!currentYear || !previousYear) return currentItems

  const offset = previousYear + 1 - currentYear
  return offset ? currentItems.map((item) => shiftItemYear(item, offset)) : currentItems
}

function resolvePreviousYearFile(rootDir, env) {
  const configuredPath = env.PREVIOUS_YEAR_DATA_FILE || DEFAULT_PREVIOUS_YEAR_FILE
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(rootDir, configuredPath)
}

export function loadPreviousYearData(rootDir, env = process.env) {
  const filePath = resolvePreviousYearFile(rootDir, env)
  const modifiedAt = fs.statSync(filePath).mtimeMs
  const cached = cache.get(filePath)

  if (cached?.modifiedAt === modifiedAt) return cached.data

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  cache.set(filePath, { modifiedAt, data })
  return data
}

export function appendPreviousYearData(currentResponse, previousResponse) {
  const rawApplicantsStatistics = Array.isArray(currentResponse?.applicants_statistics)
    ? currentResponse.applicants_statistics
    : []
  const previousStatistics = Array.isArray(previousResponse?.applicants_statistics)
    ? previousResponse.applicants_statistics
    : []
  const applicantsStatistics = alignCurrentYearStatistics(rawApplicantsStatistics, previousStatistics)

  return {
    ...currentResponse,
    applicants_statistics: applicantsStatistics,
    previous_year_statistics: previousStatistics,
    previous_year_applicants_quantity: Number(previousResponse?.applicants_quantity) || 0,
    meta: {
      ...currentResponse?.meta,
      source: currentResponse?.meta?.source || 'local',
      previousYearSource: 'file',
    },
  }
}

export function buildFileYearResponse(fileResponse, period = '2025-01') {
  const applicantsStatistics = Array.isArray(fileResponse?.applicants_statistics)
    ? fileResponse.applicants_statistics
    : []

  return {
    ...fileResponse,
    applicants_statistics: applicantsStatistics,
    previous_year_statistics: [],
    previous_year_applicants_quantity: 0,
    meta: {
      ...fileResponse?.meta,
      source: 'file',
      period,
      note: 'Архивные данные приёмной кампании 2025 года',
    },
  }
}
