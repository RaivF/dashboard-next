export function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(toNumber(value))
}

export function formatPercent(value) {
  return `${Math.round(toNumber(value))}%`
}

export function formatPercentDecimal(value) {
  const numeric = toNumber(value)

  if (numeric > 0 && numeric < 0.1) {
    return '<0,1%'
  }

  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numeric)}%`
}
