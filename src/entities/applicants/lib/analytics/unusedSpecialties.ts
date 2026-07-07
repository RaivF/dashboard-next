import type { SpecialtyRow } from '../../../specialties/lib/specialties.js'
import { normalizeSpecialty } from './grouping.js'
import type { ApplicantStatistic, SpecialtySummary } from './types.js'

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

export function buildUnusedSpecialties(
  specialties: SpecialtyRow[],
  applications: ApplicantStatistic[],
): SpecialtySummary[] {
  const occupiedKeys = new Set<string>()

  applications.forEach((item) => {
    const specialty = normalizeSpecialty(item)
    specialtyKeys(specialty.code, specialty.name).forEach((key) => occupiedKeys.add(key))
  })

  return specialties
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
}
