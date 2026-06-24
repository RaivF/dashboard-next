// @ts-nocheck
import { EXCLUDED_SPECIALTY_LEVEL_CODES, FUNDING_ORDER, METHOD_ORDER, ONLINE_METHOD_LABEL } from './constants.js'
import { applicantKey, cleanValue, containsEmptyMarker, displayValue, numberValue, readObjectValue } from './normalizers.js'
import { dateKey } from './date.js'
import { fullDate, shortDate } from './format.js'

export function sortByQuantityDesc(a, b) {
  return b.quantity - a.quantity
}

export function groupBy(items, field) {
  const map = new Map()

  items.forEach((item) => {
    const key = displayValue(item[field])
    if (key === 'Не указано') return

    const current = map.get(key) || 0
    map.set(key, current + numberValue(item.quantity))
  })

  return Array.from(map, ([name, quantity]) => ({ name, quantity })).sort(sortByQuantityDesc)
}

export function groupByFunding(items) {
  const known = new Map(FUNDING_ORDER.map((name) => [name, 0]))
  const extra = new Map()

  items.forEach((item) => {
    const name = displayValue(item.funding_type)
    if (name === 'Не указано') return

    const target = known.has(name) ? known : extra
    target.set(name, (target.get(name) || 0) + numberValue(item.quantity))
  })

  return [
    ...FUNDING_ORDER.map((name) => ({ name, quantity: known.get(name) || 0 })),
    ...Array.from(extra, ([name, quantity]) => ({ name, quantity })).sort(sortByQuantityDesc),
  ]
}

export function groupByDate(items) {
  const map = new Map()

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

export function groupApplicantsByDate(items) {
  const map = new Map()

  items.forEach((item) => {
    const key = dateKey(item.date)
    const applicant = applicantKey(item)
    const current = map.get(key) || { applicants: new Set(), fallbackQuantity: 0 }

    if (applicant) {
      current.applicants.add(applicant)
    } else {
      current.fallbackQuantity += numberValue(item.quantity)
    }

    map.set(key, current)
  })

  return Array.from(map, ([date, value]) => ({
    date,
    label: shortDate(date),
    fullLabel: fullDate(date),
    quantity: value.applicants.size + value.fallbackQuantity,
    isMissing: false,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

export function normalizeMethod(value) {
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

export function groupByMethod(items) {
  const known = new Map(METHOD_ORDER.map((method) => [method, 0]))
  const extra = new Map()

  items.forEach((item) => {
    const method = normalizeMethod(item.application_method)
    const quantity = numberValue(item.quantity)

    if (!method) return

    if (known.has(method)) {
      known.set(method, (known.get(method) || 0) + quantity)
      return
    }

    if (quantity > 0) {
      extra.set(method, (extra.get(method) || 0) + quantity)
    }
  })

  return [
    ...METHOD_ORDER.map((name) => ({ name, quantity: known.get(name) || 0 })),
    ...Array.from(extra, ([name, quantity]) => ({ name, quantity })).sort(sortByQuantityDesc),
  ]
}

export function parsePriority(value) {
  const cleaned = cleanValue(value)
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
}

export function groupPriority(items) {
  const map = new Map()

  items.forEach((item) => {
    const cleanedPriority = cleanValue(item.priority)
    if (cleanedPriority === 'Не указано') return

    const current = map.get(cleanedPriority) || 0
    map.set(cleanedPriority, current + numberValue(item.quantity))
  })

  return Array.from(map, ([priority, quantity]) => ({
    name: `Приоритет ${priority}`,
    priority: parsePriority(priority),
    quantity,
  }))
    .sort((a, b) => a.priority - b.priority || b.quantity - a.quantity)
    .slice(0, 5)
}

export function normalizeSpecialty(item) {
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

export function specialtyLevelCode(code) {
  const match = String(code || '').match(/^\s*\d+\.(\d{2})\./)
  return match?.[1] || ''
}

export function isRankedSpecialty(item) {
  return !EXCLUDED_SPECIALTY_LEVEL_CODES.has(specialtyLevelCode(item.code))
}

export function isFirstPriority(item) {
  return parsePriority(item.priority) === 1
}

export function groupBySpecialty(items) {
  const map = new Map()

  items.forEach((item) => {
    const { name, code } = normalizeSpecialty(item)
    if (name === 'Не указано') return

    const key = `${name}::${code}`
    const current = map.get(key) || { name, code, quantity: 0 }
    current.quantity += numberValue(item.quantity)
    map.set(key, current)
  })

  return Array.from(map.values()).map((item) => ({
    name: item.name,
    code: item.code,
    caption: item.code ? `Код: ${item.code}` : '',
    quantity: item.quantity,
  }))
}
