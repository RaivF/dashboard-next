import type { SpecialtyRow } from '../../../specialties/lib/specialties.js'
import { normalizeSpecialty } from './grouping.js'
import type { ApplicantStatistic, SpecialtySummary } from './types.js'

export const PINNED_UNUSED_SPECIALTIES: SpecialtySummary[] = [
  {
    name: 'Мехатроника и робототехника (Мехатронные и роботизированные технологические системы и комплексы)',
    code: '15.03.06',
    caption: 'Код: 15.03.06 • Бакалавриат',
    quantity: 0,
  },
  {
    name: 'Почвоведение (Управление земельными ресурсами)',
    code: '06.03.02',
    caption: 'Код: 06.03.02 • Бакалавриат',
    quantity: 0,
  },
]

function normalizeKeyPart(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function specialtyKeys(code: unknown, name: unknown): string[] {
  const normalizedCode = normalizeKeyPart(code)
  const normalizedName = normalizeKeyPart(name)
  const keys: string[] = []

  if (normalizedCode) keys.push(`code:${normalizedCode}`)
  if (normalizedName) keys.push(`name:${normalizedName}`)

  return keys
}

function isAllowedUnusedSpecialtyLevel(specialty: SpecialtyRow): boolean {
  const levelCode = normalizeKeyPart(specialty.code).split('.')[1]

  if (levelCode) return levelCode === '03' || levelCode === '04'

  const level = normalizeKeyPart(specialty.level)
  return level === 'бакалавриат' || level === 'магистратура'
}

export function buildUnusedSpecialties(
  specialties: SpecialtyRow[],
  applications: ApplicantStatistic[],
  pinnedSpecialties: SpecialtySummary[] = [],
): SpecialtySummary[] {
  const occupiedKeys = new Set<string>()

  applications.forEach((item) => {
    const specialty = normalizeSpecialty(item)
    specialtyKeys(specialty.code, specialty.name).forEach((key) => occupiedKeys.add(key))
  })

  const visiblePinnedSpecialties = pinnedSpecialties.filter((specialty) => (
    specialtyKeys(specialty.code, specialty.name).every((key) => !occupiedKeys.has(key))
  ))
  const pinnedKeys = new Set(
    visiblePinnedSpecialties.flatMap((specialty) => specialtyKeys(specialty.code, specialty.name)),
  )
  const automaticSpecialties = specialties
    .filter(isAllowedUnusedSpecialtyLevel)
    .filter((specialty) => {
      const keys = specialtyKeys(specialty.code, specialty.name)
      return keys.length > 0 && keys.every((key) => !occupiedKeys.has(key))
    })
    .map((specialty) => ({
      name: specialty.name,
      code: specialty.code,
      caption: specialty.code ? `Код: ${specialty.code} • ${specialty.level}` : specialty.level,
      quantity: 0,
    }))

  return [
    ...visiblePinnedSpecialties.map((specialty) => ({ ...specialty, quantity: 0 })),
    ...automaticSpecialties.filter((specialty) => (
      specialtyKeys(specialty.code, specialty.name).every((key) => !pinnedKeys.has(key))
    )),
  ]
}
