// @ts-nocheck
export function shortDate(value) {
  if (!value || value === 'Без даты') return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })
}

export function fullDate(value) {
  if (!value || value === 'Без даты') return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatRangeDate(value) {
  if (!value) return ''

  return value.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'Нет данных за выбранный период'

  if (startDate.getTime() === endDate.getTime()) {
    return formatRangeDate(endDate)
  }

  return `${formatRangeDate(startDate)} — ${formatRangeDate(endDate)}`
}

export function shortDateTime(value, showDate = false) {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  const time = parsed.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  if (!showDate) return time

  const date = parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })

  return `${date} ${time}`
}

export function fullDateTime(value) {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  const date = parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const time = parsed.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  return `${date}, ${time}`
}
