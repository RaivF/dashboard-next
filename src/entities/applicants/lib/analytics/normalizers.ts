// @ts-nocheck
import { EMPTY_MARKERS, ONLINE_METHOD_LABEL } from './constants.js'

export function normalizeText(value) {
  return String(value).replace(/\u00a0/g, ' ').trim()
}

export function containsEmptyMarker(value) {
  const normalized = normalizeText(value).toLowerCase()
  return EMPTY_MARKERS.some((marker) => normalized === marker || normalized.includes(marker))
}

export function readObjectValue(value, keys) {
  if (!value || typeof value !== 'object') return undefined

  for (const key of keys) {
    if (value[key] !== null && value[key] !== undefined && value[key] !== '') {
      return value[key]
    }
  }

  return undefined
}

function flattenObjectText(value) {
  if (!value || typeof value !== 'object') return ''

  try {
    return Object.values(value)
      .flatMap((item) => {
        if (item === null || item === undefined) return []
        if (typeof item === 'object') return Object.values(item).filter((nested) => typeof nested !== 'object')
        return [item]
      })
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(' ')
  } catch {
    return ''
  }
}

export function cleanValue(value) {
  if (value === null || value === undefined || value === '') return 'Не указано'

  if (typeof value === 'object') {
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

export function displayValue(value) {
  const cleaned = cleanValue(value)
  return DISPLAY_VALUE_MAP.get(cleaned) || cleaned
}

export function numberValue(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function directApplicantKey(item) {
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

export function applicantKey(item) {
  const directKey = directApplicantKey(item)

  if (directKey) return directKey

  const name = readObjectValue(item, ['applicant_name', 'applicantName', 'fio', 'name', 'ФИО'])
  const birthDate = readObjectValue(item, ['birth_date', 'birthDate', 'date_of_birth', 'Дата рождения'])

  if (name) {
    return `name:${cleanValue(name).toLowerCase()}::${cleanValue(birthDate || '').toLowerCase()}`
  }

  return null
}

export function countUniqueApplicants(items) {
  const keys = new Set()

  items.forEach((item) => {
    const key = applicantKey(item)
    if (key) keys.add(key)
  })

  return keys.size
}
