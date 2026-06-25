import { EMPTY_MARKERS, ONLINE_METHOD_LABEL } from './constants.js'
import type { ApplicantStatistic, AnalyticsRecord } from './types.js'
import { isAnalyticsRecord } from './types.js'

export function normalizeText(value: unknown): string {
  return String(value).replace(/\u00a0/g, ' ').trim()
}

export function containsEmptyMarker(value: unknown): boolean {
  const normalized = normalizeText(value).toLowerCase()
  return EMPTY_MARKERS.some((marker) => normalized === marker || normalized.includes(marker))
}

export function readObjectValue(value: unknown, keys: string[]): unknown {
  if (!isAnalyticsRecord(value)) return undefined

  for (const key of keys) {
    if (value[key] !== null && value[key] !== undefined && value[key] !== '') {
      return value[key]
    }
  }

  return undefined
}

function flattenObjectText(value: unknown): string {
  if (!isAnalyticsRecord(value)) return ''

  try {
    return Object.values(value)
      .flatMap((item) => {
        if (item === null || item === undefined) return []
        if (isAnalyticsRecord(item)) return Object.values(item).filter((nested) => !isAnalyticsRecord(nested))
        return [item]
      })
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(' ')
  } catch {
    return ''
  }
}

export function cleanValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Не указано'

  if (isAnalyticsRecord(value)) {
    const objectValue = readObjectValue(value, [
      'name',
      'title',
      'description',
      'presentation',
      'value',
      'Наименование',
      'Представление',
      'Описание',
    ])

    if (objectValue !== undefined) {
      return cleanValue(objectValue)
    }

    const flattened = flattenObjectText(value)
    if (!flattened || containsEmptyMarker(flattened)) return 'Не указано'

    return flattened
  }

  const cleaned = normalizeText(value)
  if (!cleaned || containsEmptyMarker(cleaned)) return 'Не указано'

  return cleaned
}

const DISPLAY_VALUE_MAP = new Map([
  ['Полное возмещение затрат', 'Платное обучение'],
  ['Платная основа', 'Платное обучение'],
  ['Договор на платное обучение', 'Платное обучение'],
  ['Целевой приём', 'Целевой прием'],
  ['Суперсервис "Поступление в вуз онлайн"', ONLINE_METHOD_LABEL],
  ['Суперсервис «Поступление в вуз онлайн»', ONLINE_METHOD_LABEL],
])

export function displayValue(value: unknown): string {
  const cleaned = cleanValue(value)
  return DISPLAY_VALUE_MAP.get(cleaned) || cleaned
}

export function numberValue(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function directApplicantKey(item: AnalyticsRecord): string | null {
  const directKey = readObjectValue(item, [
    'applicant_id',
    'applicantId',
    'applicant_code',
    'applicantCode',
    'person_id',
    'personId',
    'physical_person_id',
    'physicalPersonId',
    'Id поступающего',
    'Уникальный код поступающего',
  ])

  return directKey === undefined ? null : `id:${cleanValue(directKey).toLowerCase()}`
}

export function applicantKey(item: ApplicantStatistic): string | null {
  const directKey = directApplicantKey(item)

  if (directKey) return directKey

  const name = readObjectValue(item, ['applicant_name', 'applicantName', 'fio', 'name', 'ФИО'])
  const birthDate = readObjectValue(item, ['birth_date', 'birthDate', 'date_of_birth', 'Дата рождения'])

  if (name) {
    return `name:${cleanValue(name).toLowerCase()}::${cleanValue(birthDate || '').toLowerCase()}`
  }

  return null
}

export function countUniqueApplicants(items: ApplicantStatistic[]): number {
  const keys = new Set<string>()
  let fallbackQuantity = 0

  items.forEach((item) => {
    const key = applicantKey(item)
    if (key) {
      keys.add(key)
    } else {
      fallbackQuantity += numberValue(item.quantity)
    }
  })

  return keys.size + fallbackQuantity
}
