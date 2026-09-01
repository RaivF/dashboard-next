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
import KcpProgress from './KcpProgress.js'
import type { CompetitionGroupsDemand } from '../../../entities/competition-groups/index.js'

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
  byApplicationForm: NamedQuantity[]
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
  allItems: unknown[]
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

const MANUAL_FORM_DATA: NamedQuantity[] = [
  { name: 'Очная', quantity: 2469 },
  { name: 'Заочная', quantity: 428 },
  { name: 'Очно-заочная', quantity: 412 },
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
    title: 'Записей в выгрузке',
    getValue: (analytics) => (analytics.applicationsTotal > 0 ? analytics.applicationsTotal : 'Пусто'),
    getCaption: () => 'Строк конкурсных групп',
    icon: FileText,
    tone: 'blue',
  },
  {
    title: 'Физических лиц',
    getValue: (analytics) => (analytics.total > 0 ? analytics.total : 'Пусто'),
    getCaption: (analytics) => analytics.applicationsPerApplicant > 0
      ? `В среднем ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(analytics.applicationsPerApplicant)} записи на человека`
      : 'Уникальные поступающие',
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
    title: 'Поступающих на бюджет',
    getValue: (analytics) => (analytics.byFunding.length > 0 ? analytics.budget : 'Пусто'),
    getCaption: () => 'Уникальные физлица в категории',
    icon: Award,
    tone: 'green',
  },
  {
    title: 'Предложения целевого обучения',
    getValue: () => TARGET_ADMISSION_OFFERS_TOTAL,
    getCaption: () => 'Предложения заказчиков целевого обучения',
    icon: Target,
    tone: 'pink',
    dialog: {
      id: 'admissionPlaces',
      ariaLabel: 'Открыть партнёров целевого обучения',
      title: 'Партнёры МелГУ',
    },
  },
]

function formatCampaignYear(year: unknown): string {
  const numericYear = Number(year)
  return Number.isFinite(numericYear) ? String(numericYear) : ''
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
        <DialogMetric label="Записей в выгрузке" value={analytics.applicationsTotal} />
        <DialogMetric label="Физических лиц" value={analytics.total} />
        <DialogMetric
          label="В среднем"
          value={analytics.applicationsPerApplicant > 0
            ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(analytics.applicationsPerApplicant)
            : '—'}
          caption="записи конкурсных групп на человека"
        />
      </div>

      <div className="dashboard-dialog-grid">
        <DialogRows title="Основание обучения" rows={analytics.byFunding} />
        <DialogRows title="Форма обучения" rows={analytics.byApplicationForm.length > 0 ? analytics.byApplicationForm : MANUAL_FORM_DATA} />
      </div>
    </div>
  )
}

type DashboardContentProps = {
  analytics: DashboardAnalytics
  campaignYear: number
  competitionGroupsDemand: CompetitionGroupsDemand | null
  competitionGroupsDemandLoading: boolean
  loading: boolean
  selectedRange: string
  unusedSpecialties: NamedQuantity[]
  unusedSpecialtiesLoading: boolean
  showPreviousYearOverlay: boolean
  setShowPreviousYearOverlay: (value: boolean) => void
  showPreviousYearFunding: boolean
  setShowPreviousYearFunding: (value: boolean) => void
}

export default function DashboardContent({
  analytics,
  campaignYear,
  competitionGroupsDemand,
  competitionGroupsDemandLoading,
  loading,
  selectedRange,
  unusedSpecialties,
  unusedSpecialtiesLoading,
  showPreviousYearOverlay,
  setShowPreviousYearOverlay,
  showPreviousYearFunding,
  setShowPreviousYearFunding,
}: DashboardContentProps) {
  const [activeStatDialog, setActiveStatDialog] = useState<StatDialog | null>(null)
  const currentAcademicYear = formatCampaignYear(campaignYear)
  const previousAcademicYear = formatCampaignYear(Number(campaignYear) - 1)
  const currentCalendarYearValue = analytics.rangeEnd?.getUTCFullYear?.()
  const currentCalendarYear = currentCalendarYearValue ? String(currentCalendarYearValue) : ''
  const fundingRows = analytics.byFunding
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
      <div className="stats-grid">
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
      </div>

      <KcpProgress
        campaignYear={campaignYear}
        data={competitionGroupsDemand}
        loading={competitionGroupsDemandLoading}
      />

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
                <>
                  <h2 className="dashboard-dialog__title">Партнёры МелГУ</h2>
                  <div className="dashboard-dialog__list" aria-label="Партнёры МелГУ">
                    {TARGET_ADMISSION_PARTNERS.map((partner) => (
                      <div className="dashboard-dialog__list-item" key={partner.name}>
                        <span>{partner.name}</span>
                        <strong>{formatNumber(partner.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                </>
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
        <div className="dashboard-ignore-wrapper" data-manual-edit-ignore="true">
          <DonutChart
            title="Основание обучения"
            subtitle="Поступающие по категориям; предложения партнёров сюда не подмешиваются"
            data={fundingRows}
            loading={loading}
            previousYearData={analytics.previousYearByFunding}
            showPreviousYear={showPreviousYearFunding}
            onTogglePreviousYear={setShowPreviousYearFunding}
            currentYear={currentCalendarYear}
            previousYear={previousCalendarYear}
            comparisonOrder="previous-first"
          />
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid--middle">
        <VerticalBarChart
          title="Форма обучения по заявлениям"
          subtitle="Очная, заочная, очно-заочная"
          data={analytics.byApplicationForm.length > 0 ? analytics.byApplicationForm : MANUAL_FORM_DATA}
          loading={loading}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
        <VerticalBarChart
          title="Способ подачи в оперативной выгрузке"
          subtitle="Лично, онлайн-каналы, почта; не итог презентации"
          data={analytics.byMethod}
          loading={loading}
          currentYear={currentAcademicYear}
          previousYear={previousAcademicYear}
        />
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <DataTable title="Топ 5 направлений в оперативной выгрузке" subtitle="По количеству записей конкурсных групп" data={analytics.topSpecialties} loading={loading} />
        <DataTable title="Минимальное число записей в оперативной выгрузке" subtitle="Направления, где записи уже есть, но их меньше всего" data={analytics.bottomSpecialties} loading={loading} />
      </section>

      <section className="dashboard-grid dashboard-grid--unused">
        <DataTable
          title="Невостребованные направления"
          data={unusedSpecialties}
          loading={loading || unusedSpecialtiesLoading}
          emptyMessage={'\u041e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044e\u0442 \u043d\u0435\u0432\u043e\u0441\u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f'}
        />
      </section>
    </>
  )
}
