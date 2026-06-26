import {
  Award,
  FileText,
  MousePointerClick,
  Target,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import DataTable from '../../../shared/ui/DataTable.js'
import { formatNumber } from '../../../shared/lib/formatters.js'
import StatCard from '../../../shared/ui/StatCard.js'
import {
  DateAreaChart as RawDateAreaChart,
  DonutChart as RawDonutChart,
  VerticalBarChart as RawVerticalBarChart,
} from './charts/ChartCard.js'
import type KcpProgress from './KcpProgress.js'

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
  applicationsTotal: number
  uniqueApplicants: number
  applicationsPerApplicant: number
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

type StatDialog = 'applications' | 'admissionPlaces'

type StatCardDefinition = {
  title: string
  getValue: (analytics: DashboardAnalytics) => number | string
  getCaption: (analytics: DashboardAnalytics, selectedRange: string) => string
  icon: LucideIcon
  tone: string
  dialog?: {
    id: StatDialog
    ariaLabel: string
    title: string
  }
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
  previousYearData?: NamedQuantity[]
  showPreviousYear?: boolean
  onTogglePreviousYear?: (value: boolean) => void
  currentYear?: string
  previousYear?: string
  comparisonOrder?: 'current-first' | 'previous-first'
}

const DateAreaChart = RawDateAreaChart as ComponentType<DateAreaChartProps>
const DonutChart = RawDonutChart as ComponentType<CategoryChartProps>
const VerticalBarChart = RawVerticalBarChart as ComponentType<CategoryChartProps>

const KCP_FILL_PERCENT = 7

const MANUAL_FORM_DATA: NamedQuantity[] = [
  { name: 'Очная', quantity: 1898 },
  { name: 'Заочная', quantity: 371 },
  { name: 'Очно-заочная', quantity: 334 },
]

const TARGET_ADMISSION_PARTNERS: NamedQuantity[] = [
  {
    name: 'ГБПОУ Республики Крым "Романовский колледж индустрии гостеприимства"',
    quantity: 2,
  },
  {
    name: 'ГБПОУ Республики Крым "Белогорский технологический техникум"',
    quantity: 1,
  },
  {
    name: 'ГБПОУ Республики Крым "Евпаторийский индустриальный техникум имени С.Л. Соколова"',
    quantity: 1,
  },
  {
    name: 'Министерство транспорта и развития транспортной инфраструктуры Запорожской области',
    quantity: 1,
  },
  {
    name: 'Министерство финансов Запорожской области',
    quantity: 1,
  },
  {
    name: 'Мелитополь-Херсонский филиал ФГУП "ЖДН"',
    quantity: 1,
  },
  {
    name: 'Территориальный орган Федеральной службы государственной статистики по Запорожской области',
    quantity: 1,
  },
  {
    name: 'ГУП "Управление автомобильными дорогами Запорожской области"',
    quantity: 1,
  },
  {
    name: 'МБУ ДПО "Информационно-методический центр" городского округа Симферополь Республики Крым',
    quantity: 6,
  },
]

const TARGET_ADMISSION_OFFERS_TOTAL = TARGET_ADMISSION_PARTNERS.reduce((sum, partner) => sum + partner.quantity, 0)

const STAT_CARDS: StatCardDefinition[] = [
  {
    title: 'Всего заявлений',
    getValue: (analytics) => (analytics.applicationsTotal > 0 ? analytics.applicationsTotal : 'Пусто'),
    getCaption: (_analytics, selectedRange) => `Суммарное количество · ${selectedRange.toLowerCase()}`,
    icon: FileText,
    tone: 'blue',
    dialog: {
      id: 'applications',
      ariaLabel: 'Открыть подробную информацию по всем заявлениям',
      title: 'Подробная информация по всем заявлениям',
    },
  },
  {
    title: 'Физических лиц',
    getValue: (analytics) => (analytics.total > 0 ? analytics.total : 'Пусто'),
    getCaption: (analytics, selectedRange) => (
      analytics.uniqueApplicants
        ? `В среднем ${Math.round(analytics.applicationsPerApplicant)} заявления на человека`
        : `Уникальные люди · ${selectedRange.toLowerCase()}`
    ),
    icon: Users,
    tone: 'indigo',
  },
  {
    title: 'Онлайн-каналы',
    getValue: (analytics) => (analytics.byMethod.length > 0 ? analytics.web + analytics.online : 'Пусто'),
    getCaption: () => 'СУПЕРСЕРВИС',
    icon: MousePointerClick,
    tone: 'cyan',
  },
  {
    title: 'Бюджетная основа',
    getValue: (analytics) => (analytics.byFunding.length > 0 ? analytics.budget : 'Пусто'),
    getCaption: () => 'Поступающие на бюджет',
    icon: Award,
    tone: 'green',
  },
  {
    title: 'Целевые места',
    getValue: () => TARGET_ADMISSION_OFFERS_TOTAL,
    getCaption: () => 'Предложения заказчиков целевого обучения',
    icon: Target,
    tone: 'pink',
    dialog: {
      id: 'admissionPlaces',
      ariaLabel: 'Открыть партнёров целевого обучения',
      title: 'Партнёры целевого обучения',
    },
  },
]

function formatAcademicYear(year: unknown): string {
  const numericYear = Number(year)
  return Number.isFinite(numericYear) ? `${numericYear}-${numericYear + 1}` : ''
}

function formatDialogValue(value: number | string) {
  return typeof value === 'number' ? formatNumber(value) : value
}

function DialogMetric({ label, value, caption }: { label: string; value: number | string; caption?: string }) {
  return (
    <div className="dashboard-dialog-metric">
      <span>{label}</span>
      <strong>{formatDialogValue(value)}</strong>
      {caption && <small>{caption}</small>}
    </div>
  )
}

function KcpSummary() {
  return (
    <section className="kcp-panel kcp-panel--summary" aria-label="Заполнение контрольных цифр приёма">
      <div className="kcp-panel__header">
        <div>
          <h2>КЦП</h2>
          <p>Контрольные цифры приёма</p>
        </div>
        <div className="kcp-panel__header-actions">
          <strong>{KCP_FILL_PERCENT}%</strong>
        </div>
      </div>

      <div className="kcp-panel__track" aria-label={`КЦП заполнено на ${KCP_FILL_PERCENT}%`}>
        <span className="kcp-panel__fill" style={{ width: `${KCP_FILL_PERCENT}%` }} />
      </div>
    </section>
  )
}

function DialogRows({ title, rows }: { title: string; rows: NamedQuantity[] }) {
  const visibleRows = rows.filter((row) => row.quantity > 0)

  if (visibleRows.length === 0) return null

  return (
    <section className="dashboard-dialog-section">
      <h3>{title}</h3>
      <div className="dashboard-dialog-rows">
        {visibleRows.map((row) => (
          <div className="dashboard-dialog-row" key={`${title}-${row.name}-${row.caption || ''}`}>
            <span>
              {row.name}
              {row.caption && <small>{row.caption}</small>}
            </span>
            <strong>{formatNumber(row.quantity)}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function ApplicationsDialogContent({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <div className="dashboard-dialog-report">
      <div className="dashboard-dialog-metrics">
        <DialogMetric label="Всего заявлений" value={analytics.applicationsTotal} />
        <DialogMetric label="Физических лиц" value={analytics.total} />
        <DialogMetric
          label="В среднем"
          value={Math.round(analytics.applicationsPerApplicant)}
          caption="заявления на человека"
        />
      </div>

      <div className="dashboard-dialog-grid">
        <DialogRows title="Основание обучения" rows={analytics.byFunding} />
        <DialogRows title="Форма обучения" rows={MANUAL_FORM_DATA} />
        <DialogRows title="Уровни образования" rows={analytics.byDegree} />
        <DialogRows title="Способ подачи" rows={analytics.byMethod} />
        <DialogRows title="Приоритеты" rows={analytics.byPriority} />
        <DialogRows title="Топ направлений" rows={analytics.topSpecialties} />
        <DialogRows title="Первый приоритет" rows={analytics.firstPrioritySpecialties} />
        <DialogRows title="Наименее востребованные" rows={analytics.bottomSpecialties} />
      </div>
    </div>
  )
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
}: DashboardContentProps) {
  const [activeStatDialog, setActiveStatDialog] = useState<StatDialog | null>(null)
  const currentAcademicYear = formatAcademicYear(campaignYear)
  const previousAcademicYear = formatAcademicYear(Number(campaignYear) - 1)
  const currentCalendarYearValue = analytics.rangeEnd?.getUTCFullYear?.()
  const currentCalendarYear = currentCalendarYearValue ? String(currentCalendarYearValue) : ''
  const previousCalendarYear = String(
    analytics.previousYearComparison.previousYear ||
      (currentCalendarYearValue ? currentCalendarYearValue - 1 : ''),
  )
  const activeDialogTitle = STAT_CARDS.find((card) => card.dialog?.id === activeStatDialog)?.dialog?.title

  useEffect(() => {
    if (!activeStatDialog) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveStatDialog(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeStatDialog])

  return (
    <>
      <section className="stats-grid">
        {STAT_CARDS.map((card) => {
          const dialog = card.dialog

          return (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.getValue(analytics)}
              caption={card.getCaption(analytics, selectedRange)}
              icon={card.icon}
              tone={card.tone}
              onClick={dialog ? () => setActiveStatDialog(dialog.id) : undefined}
              ariaLabel={dialog?.ariaLabel}
            />
          )
        })}
      </section>

      <KcpSummary />

      {activeDialogTitle && (
        <div
          className="dashboard-dialog-backdrop"
          role="presentation"
          onClick={() => setActiveStatDialog(null)}
        >
          <section
            className="dashboard-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={activeDialogTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dashboard-dialog__close"
              type="button"
              aria-label="Закрыть"
              onClick={() => setActiveStatDialog(null)}
            >
              <X size={24} strokeWidth={2.4} />
            </button>
            <div className="dashboard-dialog__content">
              {activeStatDialog === 'applications' && <ApplicationsDialogContent analytics={analytics} />}
              {activeStatDialog === 'admissionPlaces' && (
                <div className="dashboard-dialog__list" aria-label="Партнёры целевого обучения">
                  {TARGET_ADMISSION_PARTNERS.map((partner) => (
                    <div className="dashboard-dialog__list-item" key={partner.name}>
                      <span>{partner.name}</span>
                      <strong>{formatNumber(partner.quantity)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

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
          title="Форма обучения по заявлениям"
          subtitle="Очная, заочная, очно-заочная"
          data={MANUAL_FORM_DATA}
          loading={loading}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
        <VerticalBarChart
          title="Способ подачи заявлений"
          subtitle="Лично, онлайн-каналы, почта"
          data={analytics.byMethod}
          loading={loading}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <DataTable title="Топ 5 самых популярных направлений" subtitle="Специальности с наибольшим количеством поступающих" data={analytics.topSpecialties} loading={loading} />
        <DataTable title="Топ 5 самых невостребованных направлений" subtitle="Специальности с наименьшим количеством поступающих" data={analytics.bottomSpecialties} loading={loading} />
      </section>
    </>
  )
}
