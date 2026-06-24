import {
  Award,
  CalendarDays,
  FileText,
  MousePointerClick,
  Target,
  Users,
} from 'lucide-react'
import DataTable from '../../../shared/ui/DataTable.js'
import StatCard from '../../../shared/ui/StatCard.js'
import { DateAreaChart, DonutChart, VerticalBarChart } from './charts/ChartCard.jsx'
import KcpProgress from './KcpProgress.jsx'

// Temporarily hidden until admission control numbers become available in source data.
const KCP_ENABLED = false
const ratioFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const STAT_CARDS = [
  {
    title: 'Всего заявлений',
    getValue: (analytics) => analytics.total,
    getCaption: (_analytics, selectedRange) => `Суммарное количество · ${selectedRange.toLowerCase()}`,
    icon: FileText,
    tone: 'blue',
  },
  {
    title: 'Поступающих',
    getValue: (analytics) => analytics.uniqueApplicants,
    getCaption: (analytics) => (
      analytics.uniqueApplicants
        ? `${ratioFormatter.format(analytics.applicationsPerApplicant)} заявления на человека`
        : 'Нет данных для дедупликации'
    ),
    icon: Users,
    tone: 'indigo',
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
    getCaption: () => 'Заявки на бюджет',
    icon: Award,
    tone: 'green',
  },
  {
    title: 'Целевой приём',
    getValue: (analytics) => analytics.target,
    getCaption: () => 'Заявки по целевой квоте',
    icon: Target,
    tone: 'pink',
  },
  {
    title: 'Онлайн-каналы',
    getValue: (analytics) => analytics.web + analytics.online,
    getCaption: () => 'СУПЕРСЕРВИС',
    icon: MousePointerClick,
    tone: 'cyan',
  },
]

function formatAcademicYear(year) {
  const numericYear = Number(year)
  return Number.isFinite(numericYear) ? `${numericYear}-${numericYear + 1}` : ''
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
}) {
  const currentAcademicYear = formatAcademicYear(campaignYear)
  const previousAcademicYear = formatAcademicYear(Number(campaignYear) - 1)
  const currentCalendarYear = analytics.rangeEnd?.getUTCFullYear?.() || ''
  const previousCalendarYear = analytics.previousYearComparison.previousYear || (currentCalendarYear ? currentCalendarYear - 1 : '')

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
        <DataTable title="Топ 5 самых популярных направлений" subtitle="Специальности с наибольшим количеством заявок" data={analytics.topSpecialties} loading={loading} />
        <DataTable title="Топ 5 самых невостребованных направлений" subtitle="Специальности с наименьшим количеством заявок" data={analytics.bottomSpecialties} loading={loading} />
        <DataTable title="Уровни образования" subtitle="Количество заявок по уровням" data={analytics.byDegree.slice(0, 7)} loading={loading} />
        <DataTable title="Приоритеты" subtitle="Первые 5 приоритетов по порядку" data={analytics.byPriority} loading={loading} />
        <DataTable title="Первый приоритет по направлениям" subtitle="Количество заявлений на специальность" data={analytics.firstPrioritySpecialties} loading={loading} />
      </section>
    </>
  )
}
