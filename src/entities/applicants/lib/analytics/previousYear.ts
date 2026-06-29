import { HALF_HOUR_CHART_RANGES } from './constants.js'
import { countUniqueApplicants, numberValue } from './normalizers.js'
import { parseDateOnly } from './date.js'
import { fullDate, fullDateTime, formatDateRange } from './format.js'
import { groupApplicantsByDate } from './grouping.js'
import { groupApplicantsByHalfHour, parseDateTime, utcDateKey, utcDateTimeKey } from './chartSeries.js'
import type { ApplicantStatistic, ChartPoint, ChartRange, PreviousYearChartPoint, PreviousYearComparison, PreviousYearWindow, RangeWindow } from './types.js'
import { getManualPreviousYearApplicantsByDate, getPreviousYearStatistics } from './types.js'

export function shiftUtcDateYears(date: Date | null, years: number): Date | null {
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

export function filterItemsByWindow(
  items: ApplicantStatistic[],
  startDate: Date | null,
  endDate: Date | null,
): ApplicantStatistic[] {
  if (!startDate || !endDate) return []

  return items.filter((item) => {
    const itemDate = parseDateOnly(item.date)
    if (!itemDate) return false
    return itemDate >= startDate && itemDate <= endDate
  })
}

function getManualPreviousYearItems(response: unknown): ApplicantStatistic[] {
  return getManualPreviousYearApplicantsByDate(response)
    .map((item) => ({
      date: String(item.date || ''),
      quantity: numberValue(item.quantity),
    }))
    .filter((item) => item.date)
}

function getPreviousYearItems(response: unknown): ApplicantStatistic[] {
  const manualPreviousYearItems = getManualPreviousYearItems(response)
  const previousYearItems = getPreviousYearStatistics(response)

  return manualPreviousYearItems.length > 0 ? manualPreviousYearItems : previousYearItems
}

export function getPreviousYearWindow(response: unknown, rangeWindow: RangeWindow): PreviousYearWindow {
  const previousYearItems = getPreviousYearItems(response)

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

export function buildPreviousYearComparison(response: unknown, rangeWindow: RangeWindow): PreviousYearComparison {
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

  const previous = countUniqueApplicants(previousYearWindow.items)

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

export function buildPreviousYearChartSeries(
  response: unknown,
  currentSeries: ChartPoint[],
  range: ChartRange,
): PreviousYearChartPoint[] {
  const previousYearItems = getPreviousYearItems(response)

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
        quantity: hasData ? previousBySlot.get(previousKey) ?? 0 : 0,
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
      quantity: hasData ? previousByDate.get(previousKey) ?? 0 : 0,
      isMissing: !hasData,
    }
  })
}
