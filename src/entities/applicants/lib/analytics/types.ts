export type AnalyticsRecord = Record<string, unknown>

export type ApplicantStatistic = AnalyticsRecord & {
  application_method?: unknown
  applicant_code?: unknown
  applicant_id?: unknown
  applicant_name?: unknown
  date?: unknown
  degree_type?: unknown
  form_of_education?: unknown
  funding_type?: unknown
  priority?: unknown
  quantity?: unknown
  specialty?: unknown
  specialty_code?: unknown
}

export type AnalyticsResponse = AnalyticsRecord & {
  admission_control_numbers?: unknown
  applicants_quantity?: unknown
  applicants_statistics?: unknown
  control_admission_numbers?: unknown
  kcp?: unknown
  meta?: {
    note?: unknown
    source?: unknown
  }
  previous_year_statistics?: unknown
}

export type RangeWindow = {
  startDate: Date | null
  endDate: Date | null
  hasDates?: boolean
}

export type ChartRange = 'all' | 'actual' | 'day' | 'twoDays' | 'week' | 'twoWeeks' | 'month' | 'year' | string

export type QuantityItem = {
  name: string
  quantity: number
}

export type ChartPoint = {
  date: string
  label: string
  fullLabel: string
  quantity: number
  isMissing: boolean
}

export type PreviousYearChartPoint = ChartPoint & {
  previousDate: string
  previousFullLabel: string
}

export type SpecialtySummary = QuantityItem & {
  caption: string
  code: string
}

export type PrioritySummary = QuantityItem & {
  priority: number
}

export type SpecialtyIdentity = {
  code: string
  name: string
}

export type AdmissionDirectionPlan = SpecialtyIdentity & {
  plan: number
}

export type AdmissionDirectionStats = AdmissionDirectionPlan & {
  current: number
  fillPercent: number
  overflow: number
  percent: number
  remaining: number
}

export type AdmissionControlNumbers = {
  categories: QuantityItem[]
  current: number
  directions: AdmissionDirectionStats[]
  fillPercent: number
  hasPlan: boolean
  overflow: number
  percent: number
  plan: number
  remaining: number
}

export type PreviousYearComparison = {
  caption: string
  current: number
  delta: number
  deltaPercent: number
  previous: number
  previousPeriodText?: string
  previousYear?: number | string
  value?: string
}

export type AnalyticsPreviousYearComparison = PreviousYearComparison & {
  value: string
}

export type AnalyticsResult = {
  allItems: ApplicantStatistic[]
  applicationsPerApplicant: number
  applicationsTotal: number
  bottomSpecialties: SpecialtySummary[]
  budget: number
  byDate: ChartPoint[]
  byDegree: QuantityItem[]
  byForm: QuantityItem[]
  byFunding: QuantityItem[]
  byMethod: QuantityItem[]
  byPriority: PrioritySummary[]
  firstPrioritySpecialties: SpecialtySummary[]
  items: ApplicantStatistic[]
  kcp: AdmissionControlNumbers
  latestDate: string
  latestDelta: number
  latestDeltaPercent: number
  latestQuantity: number
  online: number
  paid: number
  personal: number
  previousYearByDate: PreviousYearChartPoint[]
  previousYearByForm: QuantityItem[]
  previousYearByFunding: QuantityItem[]
  previousYearByMethod: QuantityItem[]
  previousYearComparison: AnalyticsPreviousYearComparison
  rangeEnd: Date | null
  rangeStart: Date | null
  rangeText: string
  source: string
  sourceNote: string
  target: number
  topSpecialties: SpecialtySummary[]
  total: number
  uniqueApplicants: number
  web: number
}

export type PreviousYearWindow = RangeWindow & {
  items: ApplicantStatistic[]
}

export function isAnalyticsRecord(value: unknown): value is AnalyticsRecord {
  return typeof value === 'object' && value !== null
}

export function getApplicantsStatistics(response: unknown): ApplicantStatistic[] {
  if (!isAnalyticsRecord(response) || !Array.isArray(response.applicants_statistics)) return []
  return response.applicants_statistics.filter(isAnalyticsRecord) as ApplicantStatistic[]
}

export function getPreviousYearStatistics(response: unknown): ApplicantStatistic[] {
  if (!isAnalyticsRecord(response) || !Array.isArray(response.previous_year_statistics)) return []
  return response.previous_year_statistics.filter(isAnalyticsRecord) as ApplicantStatistic[]
}
