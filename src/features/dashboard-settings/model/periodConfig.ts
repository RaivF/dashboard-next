export const MIN_CAMPAIGN_YEAR = 2025
export const MAX_CAMPAIGN_YEAR = 2026

export function clampCampaignYear(year: unknown): number {
  const numericYear = Number(year)
  if (!Number.isFinite(numericYear)) return MIN_CAMPAIGN_YEAR
  return Math.min(MAX_CAMPAIGN_YEAR, Math.max(MIN_CAMPAIGN_YEAR, Math.trunc(numericYear)))
}

export const RANGE_OPTIONS = [
  { value: 'actual', label: 'Актуальные' },
  { value: 'day', label: 'День' },
  { value: 'twoDays', label: '2 дня' },
  { value: 'week', label: 'Неделя' },
  { value: 'twoWeeks', label: '2 недели' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
] as const

export type RangeValue = (typeof RANGE_OPTIONS)[number]['value']

export const CALENDAR_LABELS = {
  actual: 'Последняя дата в данных',
  day: 'Выбрать день',
  twoDays: 'Дата окончания',
  week: 'Выбрать неделю',
  twoWeeks: 'Дата окончания',
  month: 'Выбрать месяц',
  year: 'Выбрать год',
} satisfies Record<RangeValue, string>

export const CALENDAR_HINTS = {
  actual: 'Показывается период с 20 июня до последней даты, которая есть в данных.',
  day: 'Показываются заявки только за выбранный день. График строится с шагом 30 минут.',
  twoDays: 'Показываются 2 дня, включая выбранную дату. График строится с шагом 30 минут.',
  week: 'Показывается календарная неделя с понедельника по воскресенье.',
  twoWeeks: 'Показываются 14 дней, включая выбранную дату.',
  month: 'Показывается выбранный календарный месяц.',
  year: 'Показывается период с 20 июня по 31 декабря выбранного года.',
} satisfies Record<RangeValue, string>

export function getDatePickerFormat(range: RangeValue): string {
  if (range === 'month') return 'MM.yyyy'
  if (range === 'year') return 'yyyy'
  return 'dd.MM.yyyy'
}

export function getRangeLabel(range: string): string {
  return RANGE_OPTIONS.find((option) => option.value === range)?.label || 'Все'
}
