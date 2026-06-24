import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CSSProperties } from 'react'
import { formatNumber, formatPercentDecimal } from '../../../../shared/lib/formatters.js'
import Panel from '../../../../shared/ui/Panel.js'
import ChartLoading from './ChartLoading.js'
import ChartTooltip from './ChartTooltip.js'
import {
  ActiveDateDot,
  ActivePreviousYearDot,
  MissingDateDot,
  PreviousYearMissingDot,
} from './ChartDots.js'
import { CHART_COLORS, chartCursorProps } from './chartConfig.js'
import { buildBarComparisonData, buildDonutRows } from './chartData.js'
import type { NamedQuantity } from './chartData.js'

type ChartPoint = {
  date?: string
  label?: string
  fullLabel?: string
  previousFullLabel?: string
  quantity: number
  isMissing?: boolean
}

type DateAreaChartProps = {
  data: ChartPoint[]
  loading?: boolean
  previousYearData?: ChartPoint[]
  showPreviousYear?: boolean
  onTogglePreviousYear?: (value: boolean) => void
}

type BarYearLabelProps = {
  x?: number | string
  y?: number | string
  width?: number | string
  height?: number | string
  label?: string
  tone?: string
}

type CategoryChartProps = {
  title: string
  subtitle: string
  data: NamedQuantity[]
  loading?: boolean
  previousYearData?: NamedQuantity[]
  showPreviousYear?: boolean
  onTogglePreviousYear?: (value: boolean) => void
  currentYear?: string
  previousYear?: string
  comparisonOrder?: 'current-first' | 'previous-first'
}

type DonutRow = ReturnType<typeof buildDonutRows>[number]
type DonutSlice = NamedQuantity & {
  color: string
}
type DonutMetricColumn = {
  key: string
  label: string
  quantityKey: 'currentQuantity' | 'previousQuantity'
  percentKey: 'currentPercent' | 'previousPercent'
}

export function DateAreaChart({
  data,
  loading = false,
  previousYearData = [],
  showPreviousYear = true,
  onTogglePreviousYear,
}: DateAreaChartProps) {
  const hasPreviousYearData = previousYearData.some((item) => !item.isMissing)
  const previousYearEnabled = showPreviousYear && hasPreviousYearData
  const chartData = data.map((item, index) => {
    const previous = previousYearData[index]

    return {
      ...item,
      quantity: item.quantity,
      previousYearQuantity: previousYearEnabled ? (previous && !previous.isMissing ? previous.quantity || 0 : 0) : undefined,
      previousYearIsMissing: previousYearEnabled ? previous?.isMissing ?? true : false,
      previousFullLabel: previousYearEnabled ? previous?.previousFullLabel : '',
    }
  })

  const action = (
    <label className={`chart-switch${!hasPreviousYearData ? ' chart-switch--disabled' : ''}`} title="Показать данные за тот же период прошлого года">
      <span>Сравнение с прошлым годом</span>
      <input
        type="checkbox"
        role="switch"
        checked={showPreviousYear && hasPreviousYearData}
        disabled={!hasPreviousYearData || loading}
        onChange={(event) => onTogglePreviousYear?.(event.target.checked)}
      />
      <span className="chart-switch__track" aria-hidden="true" />
    </label>
  )

  return (
    <Panel title="Динамика поступающих по датам" subtitle="Уникальные поступающие за выбранный диапазон. Дни без записей показываются нулём." className="panel--wide" action={action}>
      <div className="chart chart--large" aria-busy={loading}>
        {loading ? (
          <ChartLoading variant="area" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 14, right: 24, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--blue)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fill: 'var(--chart-tick)', fontSize: 16 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 16 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={chartCursorProps} />
              {previousYearEnabled && (
                <Area
                  type="monotone"
                  dataKey="previousYearQuantity"
                  name="Прошлый год"
                  stroke="var(--chart-previous-year)"
                  strokeWidth={3}
                  strokeDasharray="8 8"
                  fill="transparent"
                  dot={<PreviousYearMissingDot />}
                  activeDot={<ActivePreviousYearDot />}
                />
              )}
              <Area
                type="monotone"
                dataKey="quantity"
                name="Текущий год"
                stroke="var(--blue)"
                strokeWidth={4}
                fill="url(#quantityGradient)"
                dot={<MissingDateDot />}
                activeDot={<ActiveDateDot />}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

function BarYearLabel({ x, y, width, height, label, tone }: BarYearLabelProps) {
  const boxX = Number(x)
  const boxY = Number(y)
  const boxWidth = Number(width)
  const boxHeight = Number(height)

  if (!label || !Number.isFinite(boxX) || !Number.isFinite(boxY) || !Number.isFinite(boxWidth) || !Number.isFinite(boxHeight)) {
    return null
  }

  if (boxWidth < 24 || boxHeight < 78) return null

  const centerX = boxX + boxWidth / 2
  const centerY = boxY + boxHeight / 2

  return (
    <text
      className={`bar-year-label bar-year-label--${tone}`}
      x={centerX}
      y={centerY}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90 ${centerX} ${centerY})`}
    >
      {label}
    </text>
  )
}

export function VerticalBarChart({
  title,
  subtitle,
  data,
  loading = false,
  previousYearData = [],
  showPreviousYear = false,
  onTogglePreviousYear,
  currentYear = '',
  previousYear = '',
}: CategoryChartProps) {
  const hasPreviousYearData = previousYearData.some((item) => item.quantity > 0)
  const previousYearEnabled = showPreviousYear && hasPreviousYearData
  const chartData = previousYearEnabled ? buildBarComparisonData(data, previousYearData) : data
  const action = onTogglePreviousYear ? (
    <label className={`chart-switch${!hasPreviousYearData ? ' chart-switch--disabled' : ''}`} title="Показать данные за тот же период прошлого года">
      <span>Сравнение с прошлым годом</span>
      <input
        type="checkbox"
        role="switch"
        checked={showPreviousYear && hasPreviousYearData}
        disabled={!hasPreviousYearData || loading}
        onChange={(event) => onTogglePreviousYear?.(event.target.checked)}
      />
      <span className="chart-switch__track" aria-hidden="true" />
    </label>
  ) : null

  return (
    <Panel title={title} subtitle={subtitle} action={action}>
      <div className="chart chart--medium" aria-busy={loading}>
        {loading ? (
          <ChartLoading variant="bar" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 28, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 17, fontWeight: 750 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 14 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={chartCursorProps} />
              <Bar dataKey="quantity" name={previousYearEnabled ? 'Текущий период' : 'Заявок'} fill={previousYearEnabled ? 'var(--green)' : undefined} radius={[12, 12, 0, 0]}>
                <LabelList dataKey="quantity" position="top" formatter={formatNumber} className="bar-value-label" />
                {previousYearEnabled && (
                  <LabelList content={(props) => <BarYearLabel {...(props as BarYearLabelProps)} label={currentYear} tone="current" />} />
                )}
                {!previousYearEnabled && chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
              {previousYearEnabled && (
                <Bar dataKey="previousYearQuantity" name="Прошлый год" fill="var(--chart-previous-year)" radius={[12, 12, 0, 0]}>
                  <LabelList dataKey="previousYearQuantity" position="top" formatter={formatNumber} className="bar-value-label bar-value-label--previous" />
                  <LabelList content={(props) => <BarYearLabel {...(props as BarYearLabelProps)} label={previousYear} tone="previous" />} />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}

function DonutSection({ data, label = '', year = '' }: { data: DonutSlice[]; label?: string; year?: string }) {
  return (
    <div className="donut-section">
      {label && <div className="donut-section__label">{label}</div>}
      <div className="chart chart--donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="quantity" nameKey="name" innerRadius="58%" outerRadius="84%" paddingAngle={3} minAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {year && (
          <div className="donut-section__year" aria-label={`Учебный год отображения: ${year}`}>
            <strong>{year}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

function DonutComparisonLegend({
  rows,
  showPreviousYear,
  comparisonOrder = 'current-first',
}: {
  rows: DonutRow[]
  showPreviousYear: boolean
  comparisonOrder?: 'current-first' | 'previous-first'
}) {
  const currentColumn: DonutMetricColumn = {
    key: 'current',
    label: '??????????????',
    quantityKey: 'currentQuantity',
    percentKey: 'currentPercent',
  }
  const previousColumn: DonutMetricColumn = {
    key: 'previous',
    label: '?????????????? ??????',
    quantityKey: 'previousQuantity',
    percentKey: 'previousPercent',
  }
  const metricColumns: DonutMetricColumn[] =
    showPreviousYear && comparisonOrder === 'previous-first'
      ? [previousColumn, currentColumn]
      : [currentColumn, ...(showPreviousYear ? [previousColumn] : [])]

  return (
    <div className={`donut-legend${showPreviousYear ? ' donut-legend--compare' : ''}`} aria-label="Расшифровка диаграммы">
      <div className="donut-legend__header">
        <span>Категория</span>
        {metricColumns.map((column) => <span key={column.key}>{column.label}</span>)}
      </div>
      {rows.map((item) => (
        <div className="donut-legend__row" key={item.name} style={{ '--donut-color': item.color } as CSSProperties}>
          <div className="donut-legend__name">
            <span className="legend-list__dot" style={{ background: item.color }} />
            <span>{item.name}</span>
          </div>
          {metricColumns.map((column) => (
            <div className="donut-legend__metric" key={column.key}>
              <strong>{formatNumber(item[column.quantityKey])}</strong>
              <span>{formatPercentDecimal(item[column.percentKey])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DonutChart({
  title,
  subtitle,
  data,
  loading = false,
  previousYearData = [],
  showPreviousYear = false,
  onTogglePreviousYear,
  currentYear = '',
  previousYear = '',
  comparisonOrder = 'current-first',
}: CategoryChartProps) {
  const hasPreviousYearData = previousYearData.some((item) => item.quantity > 0)
  const previousYearEnabled = showPreviousYear && hasPreviousYearData
  const rows = buildDonutRows(data, previousYearData, previousYearEnabled)
  const currentChartData = rows.map((item) => ({
    name: item.name,
    quantity: item.currentQuantity,
    color: item.color,
  }))
  const previousChartData = rows.map((item) => ({
    name: item.name,
    quantity: item.previousQuantity,
    color: item.color,
  }))
  const action = onTogglePreviousYear ? (
    <label className={`chart-switch${!hasPreviousYearData ? ' chart-switch--disabled' : ''}`} title="Показать данные за тот же период прошлого года">
      <span>Сравнение с прошлым годом</span>
      <input
        type="checkbox"
        role="switch"
        checked={showPreviousYear && hasPreviousYearData}
        disabled={!hasPreviousYearData || loading}
        onChange={(event) => onTogglePreviousYear?.(event.target.checked)}
      />
      <span className="chart-switch__track" aria-hidden="true" />
    </label>
  ) : null

  return (
    <Panel title={title} subtitle={subtitle} action={action}>
      <div className="donut-stack" aria-busy={loading}>
        {loading ? (
          <ChartLoading variant="donut" />
        ) : (
          <>
            <div className="donut-visuals">
              {previousYearEnabled && <DonutSection data={previousChartData} label="Прошлый год" year={previousYear} />}
              <DonutSection data={currentChartData} label={previousYearEnabled ? 'Текущий период' : ''} year={currentYear} />
            </div>
            <DonutComparisonLegend rows={rows} showPreviousYear={previousYearEnabled} comparisonOrder={comparisonOrder} />
          </>
        )}
      </div>
    </Panel>
  )
}
