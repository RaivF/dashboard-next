// @ts-nocheck
import { displayValue, numberValue, readObjectValue } from './normalizers.js'
import { normalizeSpecialty } from './grouping.js'

export function normalizeAdmissionDirectionPlans(source) {
  const directions = source?.directions || source?.specialties || source?.programs || source?.items || []

  return Array.isArray(directions)
    ? directions.map((item) => ({
      code: displayValue(readObjectValue(item, ['code', 'specialty_code', 'Код'])),
      name: displayValue(readObjectValue(item, ['name', 'title', 'specialty_name', 'Наименование'])),
      plan: numberValue(readObjectValue(item, ['quantity', 'total', 'plan', 'kcp', 'value', 'Количество'])),
    })).filter((item) => item.name && item.plan > 0)
    : []
}

export function buildAdmissionDirectionStats(directionPlans, allItems) {
  if (!directionPlans.length) return []

  const actualBySpecialty = new Map()
  const actualByCode = new Map()
  const actualByName = new Map()
  const directionCodeCounts = new Map()
  const directionNameCounts = new Map()

  directionPlans.forEach((item) => {
    if (item.code) directionCodeCounts.set(item.code, (directionCodeCounts.get(item.code) || 0) + 1)
    if (item.name) directionNameCounts.set(item.name, (directionNameCounts.get(item.name) || 0) + 1)
  })

  allItems.forEach((item) => {
    const specialty = normalizeSpecialty(item)
    const quantity = numberValue(item.quantity)

    if (!specialty.name || quantity <= 0) return

    const key = `${specialty.code}::${specialty.name}`
    actualBySpecialty.set(key, (actualBySpecialty.get(key) || 0) + quantity)
    actualByCode.set(specialty.code, (actualByCode.get(specialty.code) || 0) + quantity)
    actualByName.set(specialty.name, (actualByName.get(specialty.name) || 0) + quantity)
  })

  return directionPlans.map((item) => {
    const exactCurrent = actualBySpecialty.get(`${item.code}::${item.name}`)
    const codeCurrent = item.code && directionCodeCounts.get(item.code) === 1
      ? actualByCode.get(item.code)
      : undefined
    const nameCurrent = item.name && directionNameCounts.get(item.name) === 1
      ? actualByName.get(item.name)
      : undefined
    const current = exactCurrent ?? codeCurrent ?? nameCurrent ?? 0
    const percent = item.plan ? (current / item.plan) * 100 : 0

    return {
      ...item,
      current,
      percent,
      fillPercent: Math.min(100, percent),
      remaining: Math.max(0, item.plan - current),
      overflow: Math.max(0, current - item.plan),
    }
  }).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name, 'ru'))
}

export function normalizeAdmissionControlNumbers(response, current, allItems = []) {
  const source = response?.admission_control_numbers || response?.kcp || response?.control_admission_numbers || {}
  const total = numberValue(readObjectValue(source, [
    'total',
    'quantity',
    'plan',
    'kcp',
    'КЦП',
    'КонтрольныеЦифрыПриема',
  ]))
  const categories = Array.isArray(source?.categories)
    ? source.categories.map((item) => ({
      name: displayValue(readObjectValue(item, ['name', 'title', 'funding_type', 'Наименование'])),
      quantity: numberValue(readObjectValue(item, ['quantity', 'total', 'plan', 'value', 'Количество'])),
    })).filter((item) => item.quantity > 0)
    : []
  const directionPlans = normalizeAdmissionDirectionPlans(source)
  const directions = buildAdmissionDirectionStats(directionPlans, allItems)
  const plan = total || directionPlans.reduce((sum, item) => sum + item.plan, 0) || categories.reduce((sum, item) => sum + item.quantity, 0)
  const percent = plan ? (current / plan) * 100 : 0
  const delta = current - plan

  return {
    plan,
    current,
    percent,
    fillPercent: Math.min(100, percent),
    remaining: Math.max(0, plan - current),
    overflow: Math.max(0, delta),
    hasPlan: plan > 0,
    categories,
    directions,
  }
}
