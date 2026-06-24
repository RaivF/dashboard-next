import { formatNumber } from '../../../shared/lib/formatters.js'

export type KcpSortMode = 'fillAsc' | 'fillDesc' | 'nameAsc' | 'planDesc'

export type KcpDirection = {
  code?: string
  name: string
  plan: number
  percent: number
}

export const KCP_SORT_OPTIONS: { value: KcpSortMode; label: string }[] = [
  { value: 'fillAsc', label: 'Р—Р°РїРѕР»РЅРµРЅРЅРѕСЃС‚СЊ в†‘' },
  { value: 'fillDesc', label: 'Р—Р°РїРѕР»РЅРµРЅРЅРѕСЃС‚СЊ в†“' },
  { value: 'nameAsc', label: 'Рђ-РЇ' },
  { value: 'planDesc', label: 'РљР¦Рџ в†“' },
]

export function buildKcpRulerTicks(plan: unknown) {
  const numericPlan = Number(plan)
  if (!Number.isFinite(numericPlan) || numericPlan <= 0) return []

  const maxTick = Math.floor(numericPlan / 1000) * 1000
  const ticks = []

  for (let value = 0; value <= maxTick; value += 1000) {
    ticks.push({
      value,
      label: formatNumber(value),
      percent: (value / numericPlan) * 100,
    })
  }

  return ticks
}

export function sortKcpDirections<TDirection extends KcpDirection>(
  directions: TDirection[],
  sortMode: KcpSortMode,
): TDirection[] {
  const sorted = [...directions]

  if (sortMode === 'fillDesc') {
    return sorted.sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name, 'ru'))
  }

  if (sortMode === 'nameAsc') {
    return sorted.sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'ru') ||
        String(a.code || '').localeCompare(String(b.code || ''), 'ru'),
    )
  }

  if (sortMode === 'planDesc') {
    return sorted.sort((a, b) => b.plan - a.plan || a.name.localeCompare(b.name, 'ru'))
  }

  return sorted.sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name, 'ru'))
}
