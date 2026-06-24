// @ts-nocheck
import { addUtcDays, endOfUtcMonth, endOfUtcWeek, endOfUtcYear, getAnchorDate, getDateBounds, parseDateOnly, startOfAdmissionYear, startOfUtcMonth, startOfUtcWeek } from './date.js'

export function getRangeWindow(items, range = 'all', selectedDate = null) {
  const bounds = getDateBounds(items)

  if (!bounds.hasDates) return bounds
  if (range === 'all') return bounds

  if (range === 'actual') {
    const campaignStart = startOfAdmissionYear(bounds.endDate)
    return {
      startDate: campaignStart <= bounds.endDate ? campaignStart : bounds.startDate,
      endDate: bounds.endDate,
      hasDates: true,
    }
  }

  const anchor = getAnchorDate(bounds, selectedDate)
  if (!anchor) return bounds

  if (range === 'day') {
    return { startDate: anchor, endDate: anchor, hasDates: true }
  }

  if (range === 'twoDays') {
    return { startDate: addUtcDays(anchor, -1), endDate: anchor, hasDates: true }
  }

  if (range === 'week') {
    return { startDate: startOfUtcWeek(anchor), endDate: endOfUtcWeek(anchor), hasDates: true }
  }

  if (range === 'twoWeeks') {
    return { startDate: addUtcDays(anchor, -13), endDate: anchor, hasDates: true }
  }

  if (range === 'month') {
    return { startDate: startOfUtcMonth(anchor), endDate: endOfUtcMonth(anchor), hasDates: true }
  }

  if (range === 'year') {
    return { startDate: startOfAdmissionYear(anchor), endDate: endOfUtcYear(anchor), hasDates: true }
  }

  return bounds
}

export function filterItemsByRange(items, range = 'all', selectedDate = null) {
  if (range === 'all') return items

  const window = getRangeWindow(items, range, selectedDate)
  if (!window.startDate || !window.endDate) return items

  return items.filter((item) => {
    const itemDate = parseDateOnly(item.date)
    if (!itemDate) return false
    return itemDate >= window.startDate && itemDate <= window.endDate
  })
}
