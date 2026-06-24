// @ts-nocheck
import { CHART_INTERVAL_MINUTES, HALF_HOUR_CHART_RANGES } from './constants.js'
import { applicantKey, numberValue } from './normalizers.js'
import { addUtcDays, parseDateOnly } from './date.js'
import { fullDate, fullDateTime, shortDate, shortDateTime } from './format.js'
import { groupApplicantsByDate } from './grouping.js'

export function parseDateTime(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const raw = String(value).trim()
  if (!raw) return null

  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)

  if (!hasExplicitTimezone) {
    const parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/)

    if (parts) {
      const [, year, month, day, hour = '0', minute = '0', second = '0'] = parts
      return new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ))
    }
  }

  const parsed = new Date(raw.replace(' ', 'T'))

  return Number.isNaN(parsed.getTime()) ? parseDateOnly(value) : parsed
}

export function floorUtcToInterval(date, intervalMinutes = CHART_INTERVAL_MINUTES) {
  const result = new Date(date)
  result.setUTCSeconds(0, 0)
  const minutes = result.getUTCMinutes()
  result.setUTCMinutes(Math.floor(minutes / intervalMinutes) * intervalMinutes)
  return result
}

export function addUtcMinutes(date, minutes) {
  const result = new Date(date)
  result.setUTCMinutes(result.getUTCMinutes() + minutes)
  return result
}

export function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
}

export function endOfUtcDayForChart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 30, 0))
}

export function utcDateTimeKey(date) {
  if (!date || Number.isNaN(date.getTime?.())) return ''
  return date.toISOString().slice(0, 16)
}

export function groupByHalfHour(items) {
  const map = new Map()

  items.forEach((item) => {
    const parsed = parseDateTime(item.date)
    if (!parsed) return

    const slot = floorUtcToInterval(parsed)
    const key = utcDateTimeKey(slot)
    const current = map.get(key) || 0
    map.set(key, current + numberValue(item.quantity))
  })

  return Array.from(map, ([key, quantity]) => ({
    date: key,
    label: shortDateTime(`${key}:00Z`),
    fullLabel: fullDateTime(`${key}:00Z`),
    quantity,
    isMissing: false,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

export function groupApplicantsByHalfHour(items) {
  const map = new Map()

  items.forEach((item) => {
    const parsed = parseDateTime(item.date)
    if (!parsed) return

    const slot = floorUtcToInterval(parsed)
    const key = utcDateTimeKey(slot)
    const applicant = applicantKey(item)
    const current = map.get(key) || { applicants: new Set(), fallbackQuantity: 0 }

    if (applicant) {
      current.applicants.add(applicant)
    } else {
      current.fallbackQuantity += numberValue(item.quantity)
    }

    map.set(key, current)
  })

  return Array.from(map, ([key, value]) => ({
    date: key,
    label: shortDateTime(`${key}:00Z`),
    fullLabel: fullDateTime(`${key}:00Z`),
    quantity: value.applicants.size + value.fallbackQuantity,
    isMissing: false,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

export function buildHalfHourSeries(items, startDate, endDate) {
  if (!startDate || !endDate) return groupApplicantsByHalfHour(items)

  const showDateInLabel = startDate.toISOString().slice(0, 10) !== endDate.toISOString().slice(0, 10)
  const actualBySlot = new Map(groupApplicantsByHalfHour(items).map((item) => [item.date, item.quantity]))
  const series = []
  let cursor = startOfUtcDay(startDate)
  const end = endOfUtcDayForChart(endDate)

  while (cursor <= end) {
    const key = utcDateTimeKey(cursor)
    const hasData = actualBySlot.has(key)

    series.push({
      date: key,
      label: shortDateTime(cursor, showDateInLabel),
      fullLabel: fullDateTime(cursor),
      quantity: hasData ? actualBySlot.get(key) : 0,
      isMissing: !hasData,
    })

    cursor = addUtcMinutes(cursor, CHART_INTERVAL_MINUTES)
  }

  return series
}

export function buildChartSeries(items, startDate, endDate, range) {
  if (HALF_HOUR_CHART_RANGES.has(range)) {
    return buildHalfHourSeries(items, startDate, endDate)
  }

  return buildDateSeries(items, startDate, endDate)
}

export function utcDateKey(date) {
  if (!date || Number.isNaN(date.getTime?.())) return ''
  return date.toISOString().slice(0, 10)
}

export function buildDateSeries(items, startDate, endDate) {
  if (!startDate || !endDate) return groupApplicantsByDate(items)

  const actualByDate = new Map(groupApplicantsByDate(items).map((item) => [item.date, item.quantity]))
  const series = []
  let cursor = new Date(startDate)

  while (cursor <= endDate) {
    const key = utcDateKey(cursor)
    const hasData = actualByDate.has(key)

    series.push({
      date: key,
      label: shortDate(key),
      fullLabel: fullDate(key),
      quantity: hasData ? actualByDate.get(key) : 0,
      isMissing: !hasData,
    })

    cursor = addUtcDays(cursor, 1)
  }

  return series
}
