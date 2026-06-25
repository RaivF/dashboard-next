export const MIN_CAMPAIGN_YEAR = 2025
export const MAX_CAMPAIGN_YEAR = 2026

export function clampCampaignYear(year: unknown): number {
  const numericYear = Number(year)
  if (!Number.isFinite(numericYear)) return MIN_CAMPAIGN_YEAR
  return Math.min(MAX_CAMPAIGN_YEAR, Math.max(MIN_CAMPAIGN_YEAR, Math.trunc(numericYear)))
}

export const RANGE_OPTIONS = [
  { value: 'actual', label: 'Актуальные' },
] as const

export type RangeValue = (typeof RANGE_OPTIONS)[number]['value']

export const CALENDAR_LABELS = {
  actual: 'Последняя дата в данных',
} satisfies Record<RangeValue, string>

export const CALENDAR_HINTS = {
  actual: 'Показывается период с 20 июня до последней даты, которая есть в данных.',
} satisfies Record<RangeValue, string>

export function getRangeLabel(range: string): string {
  return RANGE_OPTIONS.find((option) => option.value === range)?.label || 'Все'
}
