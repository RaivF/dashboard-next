import {
  Award,
  CalendarDays,
  MousePointerClick,
  Target,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import DataTable from '../../../shared/ui/DataTable.js'
import StatCard from '../../../shared/ui/StatCard.js'
import {
  DateAreaChart as RawDateAreaChart,
  DonutChart as RawDonutChart,
  VerticalBarChart as RawVerticalBarChart,
} from './charts/ChartCard.js'
import KcpProgress from './KcpProgress.js'

// Temporarily hidden until admission control numbers become available in source data.
const KCP_ENABLED = false
type NamedQuantity = {
  name: string
  quantity: number
  caption?: string
  code?: string
}

type ChartPoint = {
  date: string
  quantity: number
  label?: string
  fullLabel?: string
  isMissing?: boolean
}

type DashboardAnalytics = {
  total: number
  uniqueApplicants: number
  previousYearComparison: {
    value: string
    caption: string
    previousYear?: number | string
  }
  budget: number
  target: number
  web: number
  online: number
  rangeEnd?: Date | null
  kcp: Parameters<typeof KcpProgress>[0]['data']
  byDate: ChartPoint[]
  previousYearByDate: ChartPoint[]
  byFunding: NamedQuantity[]
  previousYearByFunding: NamedQuantity[]
  byForm: NamedQuantity[]
  previousYearByForm: NamedQuantity[]
  byMethod: NamedQuantity[]
  previousYearByMethod: NamedQuantity[]
  topSpecialties: NamedQuantity[]
  bottomSpecialties: NamedQuantity[]
  byDegree: NamedQuantity[]
  byPriority: NamedQuantity[]
  firstPrioritySpecialties: NamedQuantity[]
}

type StatCardDefinition = {
  title: string
  getValue: (analytics: DashboardAnalytics) => number | string
  getCaption: (analytics: DashboardAnalytics, selectedRange: string) => string
  icon: LucideIcon
  tone: string
}

type DateAreaChartProps = {
  data: ChartPoint[]
  loading: boolean
  previousYearData: ChartPoint[]
  showPreviousYear: boolean
  onTogglePreviousYear: (value: boolean) => void
}

type CategoryChartProps = {
  title: string
  subtitle: string
  data: NamedQuantity[]
  loading: boolean
  previousYearData: NamedQuantity[]
  showPreviousYear: boolean
  onTogglePreviousYear: (value: boolean) => void
  currentYear?: string
  previousYear?: string
  comparisonOrder?: 'current-first' | 'previous-first'
}

const DateAreaChart = RawDateAreaChart as ComponentType<DateAreaChartProps>
const DonutChart = RawDonutChart as ComponentType<CategoryChartProps>
const VerticalBarChart = RawVerticalBarChart as ComponentType<CategoryChartProps>

const STAT_CARDS: StatCardDefinition[] = [
  {
    title: 'Поступающих',
    getValue: (analytics) => analytics.total,
    getCaption: (_analytics, selectedRange) => `Уникальные люди · ${selectedRange.toLowerCase()}`,
    icon: Users,
    tone: 'blue',
  },
  {
    title: 'К прошлому году',
    getValue: (analytics) => analytics.previousYearComparison.value,
    getCaption: (analytics) => analytics.previousYearComparison.caption,
    icon: CalendarDays,
    tone: 'purple',
  },
  {
    title: 'Бюджетная основа',
    getValue: (analytics) => analytics.budget,
    getCaption: () => 'Поступающие на бюджет',
    icon: Award,
    tone: 'green',
  },
  {
    title: 'Целевой приём',
    getValue: (analytics) => analytics.target,
    getCaption: () => 'Поступающие по целевой квоте',
    icon: Target,
    tone: 'pink',
  },
  {
    title: 'Онлайн-каналы',
    getValue: (analytics) => analytics.web + analytics.online,
    getCaption: () => 'Поступающие через онлайн-каналы',
    icon: MousePointerClick,
    tone: 'cyan',
  },
]

function formatAcademicYear(year: unknown): string {
  const numericYear = Number(year)
  return Number.isFinite(numericYear) ? `${numericYear}-${numericYear + 1}` : ''
}

type DashboardContentProps = {
  analytics: DashboardAnalytics
  campaignYear: number
  loading: boolean
  selectedRange: string
  showPreviousYearOverlay: boolean
  setShowPreviousYearOverlay: (value: boolean) => void
  showPreviousYearFunding: boolean
  setShowPreviousYearFunding: (value: boolean) => void
  showPreviousYearForm: boolean
  setShowPreviousYearForm: (value: boolean) => void
  showPreviousYearMethod: boolean
  setShowPreviousYearMethod: (value: boolean) => void
}

export default function DashboardContent({
  analytics,
  campaignYear,
  loading,
  selectedRange,
  showPreviousYearOverlay,
  setShowPreviousYearOverlay,
  showPreviousYearFunding,
  setShowPreviousYearFunding,
  showPreviousYearForm,
  setShowPreviousYearForm,
  showPreviousYearMethod,
  setShowPreviousYearMethod,
}: DashboardContentProps) {
  const currentAcademicYear = formatAcademicYear(campaignYear)
  const previousAcademicYear = formatAcademicYear(Number(campaignYear) - 1)
  const currentCalendarYearValue = analytics.rangeEnd?.getUTCFullYear?.()
  const currentCalendarYear = currentCalendarYearValue ? String(currentCalendarYearValue) : ''
  const previousCalendarYear = String(
    analytics.previousYearComparison.previousYear ||
      (currentCalendarYearValue ? currentCalendarYearValue - 1 : ''),
  )

  return (
    <>
      {/* КЦП показывает итог по всей приёмной кампании и намеренно не синхронизируется с выбранным периодом. */}
      {KCP_ENABLED && <KcpProgress data={analytics.kcp} loading={loading} />}

      <section className="stats-grid">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.getValue(analytics)}
            caption={card.getCaption(analytics, selectedRange)}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--top">
        <DateAreaChart
          data={analytics.byDate}
          loading={loading}
          previousYearData={analytics.previousYearByDate}
          showPreviousYear={showPreviousYearOverlay}
          onTogglePreviousYear={setShowPreviousYearOverlay}
        />
        <DonutChart
          title="Основание обучения"
          subtitle="Бюджет, платное обучение, целевой приём, отдельная и особая квоты"
          data={analytics.byFunding}
          loading={loading}
          previousYearData={analytics.previousYearByFunding}
          showPreviousYear={showPreviousYearFunding}
          onTogglePreviousYear={setShowPreviousYearFunding}
          currentYear={currentCalendarYear}
          previousYear={previousCalendarYear}
          comparisonOrder="previous-first"
        />
      </section>

      <section className="dashboard-grid dashboard-grid--middle">
        <VerticalBarChart
          title="Форма обучения"
          subtitle="Очная, заочная, очно-заочная"
          data={analytics.byForm}
          loading={loading}
          previousYearData={analytics.previousYearByForm}
          showPreviousYear={showPreviousYearForm}
          onTogglePreviousYear={setShowPreviousYearForm}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
        <VerticalBarChart
          title="Способ подачи"
          subtitle="Лично, онлайн-каналы, почта"
          data={analytics.byMethod}
          loading={loading}
          previousYearData={analytics.previousYearByMethod}
          showPreviousYear={showPreviousYearMethod}
          onTogglePreviousYear={setShowPreviousYearMethod}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <DataTable title="Топ 5 самых популярных направлений" subtitle="Специальности с наибольшим количеством поступающих" data={analytics.topSpecialties} loading={loading} />
        <DataTable title="Топ 5 самых невостребованных направлений" subtitle="Специальности с наименьшим количеством поступающих" data={analytics.bottomSpecialties} loading={loading} />
        <DataTable title="Уровни образования" subtitle="Количество поступающих по уровням" data={analytics.byDegree.slice(0, 7)} loading={loading} />
        <DataTable title="Приоритеты" subtitle="Первые 5 приоритетов по порядку" data={analytics.byPriority} loading={loading} />
        <DataTable title="Первый приоритет по направлениям" subtitle="Количество поступающих на специальность" data={analytics.firstPrioritySpecialties} loading={loading} />
      </section>
    </>
  )
}
