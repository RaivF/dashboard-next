// @ts-nocheck
import { HALF_HOUR_CHART_RANGES } from './constants.js'
import { numberValue } from './normalizers.js'
import { parseDateOnly } from './date.js'
import { fullDate, fullDateTime, formatDateRange } from './format.js'
import { groupApplicantsByDate } from './grouping.js'
import { groupApplicantsByHalfHour, parseDateTime, utcDateKey, utcDateTimeKey } from './chartSeries.js'

export function shiftUtcDateYears(date, years) {
  if (!date || Number.isNaN(date.getTime?.())) return null
  return new Date(Date.UTC(
    date.getUTCFullYear() + years,
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ))
}

export function filterItemsByWindow(items, startDate, endDate) {
  if (!startDate || !endDate) return []

  return items.filter((item) => {
    const itemDate = parseDateOnly(item.date)
    if (!itemDate) return false
    return itemDate >= startDate && itemDate <= endDate
  })
}

export function getPreviousYearWindow(response, rangeWindow) {
  const previousYearItems = Array.isArray(response?.previous_year_statistics)
    ? response.previous_year_statistics
    : []

  if (!rangeWindow.startDate || !rangeWindow.endDate || previousYearItems.length === 0) {
    return {
      items: [],
      startDate: null,
      endDate: null,
    }
  }

  const startDate = shiftUtcDateYears(rangeWindow.startDate, -1)
  const endDate = shiftUtcDateYears(rangeWindow.endDate, -1)

  return {
    items: filterItemsByWindow(previousYearItems, startDate, endDate),
    startDate,
    endDate,
  }
}

export function buildPreviousYearComparison(response, rangeWindow) {
  const previousYearWindow = getPreviousYearWindow(response, rangeWindow)

  if (!previousYearWindow.startDate || !previousYearWindow.endDate) {
    return {
      current: 0,
      previous: 0,
      delta: 0,
      deltaPercent: 0,
      caption: 'Нет данных за прошлый год',
    }
  }

  const previous = previousYearWindow.items.reduce((sum, item) => sum + numberValue(item.quantity), 0)

  return {
    current: 0,
    previous,
    delta: 0,
    deltaPercent: previous ? 0 : 0,
    previousPeriodText: formatDateRange(previousYearWindow.startDate, previousYearWindow.endDate),
    previousYear: previousYearWindow.startDate?.getUTCFullYear?.() || '',
    caption: previous ? '' : 'Нет данных за прошлый год',
  }
}

export function buildPreviousYearChartSeries(response, currentSeries, range) {
  const previousYearItems = Array.isArray(response?.previous_year_statistics)
    ? response.previous_year_statistics
    : []

  if (!currentSeries.length || previousYearItems.length === 0) return []

  if (HALF_HOUR_CHART_RANGES.has(range)) {
    const previousBySlot = new Map(groupApplicantsByHalfHour(previousYearItems).map((item) => [item.date, item.quantity]))

    return currentSeries.map((point) => {
      const currentDate = parseDateTime(point.date)
      const previousDate = shiftUtcDateYears(currentDate, -1)
      const previousKey = utcDateTimeKey(previousDate)
      const hasData = previousBySlot.has(previousKey)

      return {
        date: point.date,
        previousDate: previousKey,
        label: point.label,
        fullLabel: point.fullLabel,
        previousFullLabel: fullDateTime(previousDate),
        quantity: hasData ? previousBySlot.get(previousKey) : 0,
        isMissing: !hasData,
      }
    })
  }

  const previousByDate = new Map(groupApplicantsByDate(previousYearItems).map((item) => [item.date, item.quantity]))

  return currentSeries.map((point) => {
    const currentDate = parseDateOnly(point.date)
    const previousDate = shiftUtcDateYears(currentDate, -1)
    const previousKey = utcDateKey(previousDate)
    const hasData = previousByDate.has(previousKey)

    return {
      date: point.date,
      previousDate: previousKey,
      label: point.label,
      fullLabel: point.fullLabel,
      previousFullLabel: fullDate(previousKey),
      quantity: hasData ? previousByDate.get(previousKey) : 0,
      isMissing: !hasData,
    }
  })
}
