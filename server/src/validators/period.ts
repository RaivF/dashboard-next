export function normalizePeriod(period: unknown): string | null {
  if (!period) return null
  const value = String(period).trim()
  const match = value.match(/^(\d{4})(?:-(\d{2}))?$/)
  if (!match) return null

  const year = match[1]
  const month = match[2] || '01'
  const monthNumber = Number(month)

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null
  }

  return `${year}-${month}`
}
