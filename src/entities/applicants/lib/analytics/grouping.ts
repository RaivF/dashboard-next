import { EXCLUDED_SPECIALTY_LEVEL_CODES, FUNDING_ORDER, METHOD_ORDER, ONLINE_METHOD_LABEL } from './constants.js'
import { applicantKey, cleanValue, containsEmptyMarker, displayValue, numberValue, readObjectValue } from './normalizers.js'
import { dateKey } from './date.js'
import { fullDate, shortDate } from './format.js'
import type { ApplicantStatistic, ChartPoint, PrioritySummary, QuantityItem, SpecialtyIdentity, SpecialtySummary } from './types.js'

type ApplicantBucket = {
  applicants: Set<string>
  fallbackQuantity: number
}

function createApplicantBucket(): ApplicantBucket {
  return {
    applicants: new Set(),
    fallbackQuantity: 0,
  }
}

function addItemToBucket(bucket: ApplicantBucket, item: ApplicantStatistic) {
  const applicant = applicantKey(item)

  if (applicant) {
    bucket.applicants.add(applicant)
  } else {
    bucket.fallbackQuantity += numberValue(item.quantity)
  }
}

function bucketQuantity(bucket: ApplicantBucket | undefined): number {
  return (bucket?.applicants.size || 0) + (bucket?.fallbackQuantity || 0)
}

export function sortByQuantityDesc(a: QuantityItem, b: QuantityItem): number {
  return b.quantity - a.quantity
}

export function groupBy(items: ApplicantStatistic[], field: keyof ApplicantStatistic): QuantityItem[] {
  const map = new Map<string, ApplicantBucket>()

  items.forEach((item) => {
    const key = displayValue(item[field])
    if (key === 'Не указано') return

    const current = map.get(key) || createApplicantBucket()
    addItemToBucket(current, item)
    map.set(key, current)
  })

  return Array.from(map, ([name, bucket]) => ({ name, quantity: bucketQuantity(bucket) })).sort(sortByQuantityDesc)
}

export function groupByFunding(items: ApplicantStatistic[]): QuantityItem[] {
  const known = new Map<string, ApplicantBucket>(FUNDING_ORDER.map((name) => [name, createApplicantBucket()]))
  const extra = new Map<string, ApplicantBucket>()

  items.forEach((item) => {
    const name = displayValue(item.funding_type)
    if (name === 'Не указано') return

    const target = known.has(name) ? known : extra
    const current = target.get(name) || createApplicantBucket()
    addItemToBucket(current, item)
    target.set(name, current)
  })

  return [
    ...FUNDING_ORDER.map((name) => ({ name, quantity: bucketQuantity(known.get(name)) })),
    ...Array.from(extra, ([name, bucket]) => ({ name, quantity: bucketQuantity(bucket) })).sort(sortByQuantityDesc),
  ]
}

export function groupByDate(items: ApplicantStatistic[]): ChartPoint[] {
  const map = new Map<string, number>()

  items.forEach((item) => {
    const key = dateKey(item.date)
    const current = map.get(key) || 0
    map.set(key, current + numberValue(item.quantity))
  })

  return Array.from(map, ([date, quantity]) => ({
    date,
    label: shortDate(date),
    fullLabel: fullDate(date),
    quantity,
    isMissing: false,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

export function groupApplicantsByDate(items: ApplicantStatistic[]): ChartPoint[] {
  const applicantDates = new Map<string, string>()
  const fallbackByDate = new Map<string, number>()

  items.forEach((item) => {
    const key = dateKey(item.date)
    const applicant = applicantKey(item)

    if (applicant) {
      const currentDate = applicantDates.get(applicant)
      if (!currentDate || key < currentDate) applicantDates.set(applicant, key)
    } else {
      fallbackByDate.set(key, (fallbackByDate.get(key) || 0) + numberValue(item.quantity))
    }
  })

  const map = new Map<string, number>()

  applicantDates.forEach((date) => {
    map.set(date, (map.get(date) || 0) + 1)
  })

  fallbackByDate.forEach((quantity, date) => {
    map.set(date, (map.get(date) || 0) + quantity)
  })

  return Array.from(map, ([date, quantity]) => ({
    date,
    label: shortDate(date),
    fullLabel: fullDate(date),
    quantity,
    isMissing: false,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

export function normalizeMethod(value: unknown): string | null {
  const cleaned = displayValue(value)
  if (cleaned === 'Не указано') return null

  const normalized = cleaned.toLowerCase()
  if (containsEmptyMarker(cleaned)) return null
  if (normalized.includes('епгу')) return ONLINE_METHOD_LABEL
  if (normalized.includes('суперсервис')) return ONLINE_METHOD_LABEL
  if (normalized.includes('веб')) return ONLINE_METHOD_LABEL
  if (normalized.startsWith('лк') || normalized.includes('личный кабинет')) return ONLINE_METHOD_LABEL
  if (normalized.includes('загрузка по запросу')) return ONLINE_METHOD_LABEL
  if (normalized.includes('лич')) return 'Лично'
  if (normalized.includes('почт')) return 'Почта'

  return cleaned
}

export function groupByMethod(items: ApplicantStatistic[]): QuantityItem[] {
  const known = new Map<string, ApplicantBucket>(METHOD_ORDER.map((method) => [method, createApplicantBucket()]))
  const extra = new Map<string, ApplicantBucket>()

  items.forEach((item) => {
    const method = normalizeMethod(item.application_method)

    if (!method) return

    const target = known.has(method) ? known : extra
    const current = target.get(method) || createApplicantBucket()
    addItemToBucket(current, item)
    target.set(method, current)
  })

  return [
    ...METHOD_ORDER.map((name) => ({ name, quantity: bucketQuantity(known.get(name)) })),
    ...Array.from(extra, ([name, bucket]) => ({ name, quantity: bucketQuantity(bucket) })).sort(sortByQuantityDesc),
  ]
}

export function parsePriority(value: unknown): number {
  const cleaned = cleanValue(value)
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
}

export function groupPriority(items: ApplicantStatistic[]): PrioritySummary[] {
  const map = new Map<string, ApplicantBucket>()

  items.forEach((item) => {
    const cleanedPriority = cleanValue(item.priority)
    if (cleanedPriority === 'Не указано') return

    const current = map.get(cleanedPriority) || createApplicantBucket()
    addItemToBucket(current, item)
    map.set(cleanedPriority, current)
  })

  return Array.from(map, ([priority, bucket]) => ({
    name: `Приоритет ${priority}`,
    priority: parsePriority(priority),
    quantity: bucketQuantity(bucket),
  }))
    .sort((a, b) => a.priority - b.priority || b.quantity - a.quantity)
    .slice(0, 5)
}

export function normalizeSpecialty(item: ApplicantStatistic): SpecialtyIdentity {
  const specialty = item.specialty

  if (specialty && typeof specialty === 'object') {
    const name = cleanValue(readObjectValue(specialty, [
      'name',
      'title',
      'description',
      'presentation',
      'Наименование',
      'Представление',
      'Описание',
    ]))
    const code = cleanValue(readObjectValue(specialty, [
      'code',
      'specialty_code',
      'okso',
      'OKSO',
      'Код',
      'КодСпециальности',
    ]))

    return {
      name,
      code: code === 'Не указано' ? '' : code,
    }
  }

  const itemCode = cleanValue(item.specialty_code)

  return {
    name: cleanValue(specialty),
    code: itemCode === 'Не указано' ? '' : itemCode,
  }
}

export function specialtyLevelCode(code: unknown): string {
  const match = String(code || '').match(/^\s*\d+\.(\d{2})\./)
  return match?.[1] || ''
}

export function isRankedSpecialty(item: SpecialtyIdentity): boolean {
  return !EXCLUDED_SPECIALTY_LEVEL_CODES.has(specialtyLevelCode(item.code))
}

export function isFirstPriority(item: ApplicantStatistic): boolean {
  return parsePriority(item.priority) === 1
}

export function groupBySpecialty(items: ApplicantStatistic[]): SpecialtySummary[] {
  const map = new Map<string, SpecialtyIdentity & ApplicantBucket>()

  items.forEach((item) => {
    const { name, code } = normalizeSpecialty(item)
    if (name === 'Не указано') return

    const key = `${name}::${code}`
    const current = map.get(key) || { name, code, ...createApplicantBucket() }
    addItemToBucket(current, item)
    map.set(key, current)
  })

  return Array.from(map.values()).map((item) => ({
    name: item.name,
    code: item.code,
    caption: item.code ? `Код: ${item.code}` : '',
    quantity: bucketQuantity(item),
  }))
}
