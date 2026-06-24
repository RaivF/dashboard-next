import { formatNumber } from '../../../../shared/lib/formatters.js'

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const currentPayloadItem = payload.find((item) => item.dataKey !== 'previousYearQuantity') || payload[0]
  const tooltipPayload = currentPayloadItem?.payload
  const tooltipLabel = tooltipPayload?.fullLabel || label
  const orderedPayload = [...payload].sort((a, b) => {
    if (a.dataKey === 'previousYearQuantity') return 1
    if (b.dataKey === 'previousYearQuantity') return -1
    return 0
  })
  const isMissingPayload = (item) => {
    if (item.dataKey === 'previousYearQuantity') return item.payload?.previousYearIsMissing
    return item.payload?.isMissing
  }

  return (
    <div className="chart-tooltip">
      {tooltipLabel && <div className="chart-tooltip__label">{tooltipLabel}</div>}
      {orderedPayload.map((item) => {
        const isMissing = isMissingPayload(item)

        return (
          <div className={`chart-tooltip__item${isMissing ? ' chart-tooltip__item--muted' : ''}`} key={`${item.dataKey}-${item.name}`}>
            <span>{item.name || item.payload?.name || 'Заявок'}</span>
            <strong>{isMissing ? 'Нет данных' : formatNumber(item.value)}</strong>
          </div>
        )
      })}
      {tooltipPayload?.previousFullLabel && (
        <div className="chart-tooltip__note">Прошлый год: {tooltipPayload.previousFullLabel}</div>
      )}
    </div>
  )
}
