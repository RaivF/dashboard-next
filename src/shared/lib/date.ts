export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function toPickerDate(date: Date | null | undefined): Date | null {
  if (!date || Number.isNaN(date.getTime())) return null
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function isSameCalendarDay(
  left: Date | null | undefined,
  right: Date | null | undefined,
): boolean {
  if (!left || !right) return false
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function isDateWithinRange(
  date: Date | null | undefined,
  start: Date | null | undefined,
  end: Date | null | undefined,
): boolean {
  if (!date || !start || !end) return false
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const to = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return current >= from && current <= to
}
