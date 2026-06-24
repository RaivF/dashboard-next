import { ADMISSION_CAMPAIGN_START_DAY, ADMISSION_CAMPAIGN_START_MONTH } from './constants.js'
import { cleanValue } from './normalizers.js'
import type { ApplicantStatistic, RangeWindow } from './types.js'

export function toUtcDateOnly(date: Date | null | undefined): Date | null {
  if (!date || Number.isNaN(date.getTime?.())) return null
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function dateKey(value: unknown): string {
  if (!value) return 'Без даты'

  if (value instanceof Date) {
    const utc = toUtcDateOnly(value)
    return utc ? utc.toISOString().slice(0, 10) : 'Без даты'
  }

  const raw = String(value)
  const directMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (directMatch) return directMatch[1]

  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return cleanValue(value)
  return parsed.toISOString().slice(0, 10)
}

export function parseDateOnly(value: unknown): Date | null {
  const key = dateKey(value)
  if (!key || key === 'Без даты') return null

  const parsed = new Date(`${key}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

export function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return addUtcDays(date, diff)
}

export function endOfUtcWeek(date: Date): Date {
  return addUtcDays(startOfUtcWeek(date), 6)
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

export function startOfAdmissionYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), ADMISSION_CAMPAIGN_START_MONTH, ADMISSION_CAMPAIGN_START_DAY))
}

export function endOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31))
}

export function collectDatedItems(items: ApplicantStatistic[]): Array<{ item: ApplicantStatistic; date: Date }> {
  return items
    .map((item) => ({ item, date: parseDateOnly(item.date) }))
    .filter((entry): entry is { item: ApplicantStatistic; date: Date } => Boolean(entry.date))
}

export function getDateBounds(items: ApplicantStatistic[]): RangeWindow {
  const datedItems = collectDatedItems(items)

  if (datedItems.length === 0) {
    return { startDate: null, endDate: null, hasDates: false }
  }

  return datedItems.reduce((bounds, current) => ({
    startDate: current.date < bounds.startDate ? current.date : bounds.startDate,
    endDate: current.date > bounds.endDate ? current.date : bounds.endDate,
    hasDates: true,
  }), {
    startDate: datedItems[0].date,
    endDate: datedItems[0].date,
    hasDates: true,
  })
}

export function getAnchorDate(bounds: RangeWindow, selectedDate: Date | null = null): Date | null {
  return toUtcDateOnly(selectedDate) || bounds.endDate || null
}

export function formatStorageDate(date: Date | null | undefined): string {
  const utc = toUtcDateOnly(date)
  return utc ? utc.toISOString().slice(0, 10) : ''
}

export function parseStorageDate(value: unknown): Date | null {
  if (!value) return null
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
}
