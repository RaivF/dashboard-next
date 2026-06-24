export function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatNumber(value: unknown): string {
  return new Intl.NumberFormat('ru-RU').format(toNumber(value))
}

export function formatPercent(value: unknown): string {
  return `${Math.round(toNumber(value))}%`
}

export function formatPercentDecimal(value: unknown): string {
  const numeric = toNumber(value)

  if (numeric > 0 && numeric < 0.1) {
    return '<0,1%'
  }

  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numeric)}%`
}
