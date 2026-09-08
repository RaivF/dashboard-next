import {
  addUtcDays,
  formatDateRange,
  fullDate,
  parseDateOnly,
  shiftUtcDateYears,
  shortDate,
  startOfAdmissionYear,
  utcDateKey,
  type AnalyticsResult,
  type ChartPoint,
  type PreviousYearChartPoint,
  type QuantityItem,
  type SpecialtySummary,
} from '../../../entities/applicants/lib/analytics.js'
import {
  CAMPAIGN_RESULTS_2026,
  type RankedResult,
} from '../../../entities/campaign-results/index.js'

const results = CAMPAIGN_RESULTS_2026
// The 17 August export and the final 31 August snapshot were confirmed to be identical.
const UNCHANGED_SNAPSHOT_DATE = '2026-08-17'

function toSnapshotSeries(analytics: AnalyticsResult, startDate: Date, endDate: Date): ChartPoint[] {
  const start = utcDateKey(startDate)
  const end = utcDateKey(endDate)
  const points = new Map(analytics.byDate
    .filter((point) => point.date >= start && point.date <= end)
    .map((point) => [point.date, point]))
  const knownPoints = [...points.values()].filter((point) => !point.isMissing)

  if (knownPoints.length === 0) return []

  const hasConfirmedSnapshot = knownPoints.some((point) => point.date >= UNCHANGED_SNAPSHOT_DATE)
  const series: ChartPoint[] = []

  for (let cursor = startDate; cursor <= endDate; cursor = addUtcDays(cursor, 1)) {
    const date = utcDateKey(cursor)
    const existing = points.get(date)

    series.push({
      date,
      label: shortDate(date),
      fullLabel: fullDate(date),
      quantity: existing?.quantity ?? 0,
      isMissing: hasConfirmedSnapshot && date > UNCHANGED_SNAPSHOT_DATE
        ? false
        : existing?.isMissing ?? true,
    })
  }

  return series
}

function alignPreviousYearSeries(analytics: AnalyticsResult, byDate: ChartPoint[]): PreviousYearChartPoint[] {
  if (analytics.previousYearByDate.length === 0) return []

  const previousPoints = new Map(analytics.previousYearByDate.map((point) => [point.date, point]))

  return byDate.map((point) => {
    const previous = previousPoints.get(point.date)
    const previousDate = utcDateKey(shiftUtcDateYears(parseDateOnly(point.date), -1))

    return {
      date: point.date,
      label: point.label,
      fullLabel: point.fullLabel,
      previousDate,
      previousFullLabel: fullDate(previousDate),
      quantity: previous?.quantity ?? 0,
      isMissing: previous?.isMissing ?? true,
    }
  })
}

function toMethodRows(year: 'current' | 'previous'): QuantityItem[] {
  return results.applications.methods.map((method) => ({
    name: method.name,
    quantity: method[year],
  }))
}

function toSpecialtyRows(rows: readonly RankedResult[]): SpecialtySummary[] {
  return rows.map((row) => ({
    name: row.name,
    code: row.code || '',
    caption: [row.code && `Код: ${row.code}`, row.caption].filter(Boolean).join(' · '),
    quantity: row.value,
  }))
}

function synchronizeQuotaRows(rows: QuantityItem[], year: number): QuantityItem[] {
  const quotas = results.quotas.enrolledByYear.find((item) => item.year === year)
  if (!quotas || rows.length === 0) return rows

  const quantities = new Map([
    ['Целевая квота', quotas.target],
    ['Отдельная квота (СВО)', quotas.separate],
    ['Особая квота', quotas.special],
  ])
  const synchronized = rows.map((row) => ({
    ...row,
    quantity: quantities.get(row.name) ?? row.quantity,
  }))
  for (const [name, quantity] of quantities) {
    if (!rows.some((row) => row.name === name)) synchronized.push({ name, quantity })
  }
  return synchronized
}

export function applyCampaignResults2026(
  analytics: AnalyticsResult,
  campaignYear: number,
): AnalyticsResult {
  // Quota enrollment must agree with the upper summary for both displayed years.
  const byFunding = synchronizeQuotaRows(analytics.byFunding, campaignYear)
  const previousYearByFunding = synchronizeQuotaRows(analytics.previousYearByFunding, campaignYear - 1)
  const quotaAnalytics = byFunding === analytics.byFunding && previousYearByFunding === analytics.previousYearByFunding
    ? analytics
    : {
      ...analytics,
      byFunding,
      previousYearByFunding,
      target: byFunding.find((row) => row.name === 'Целевая квота')?.quantity ?? analytics.target,
    }
  if (campaignYear !== 2026) return quotaAnalytics

  const rangeEnd = new Date(`${results.source.snapshotDate}T00:00:00Z`)
  const rangeStart = startOfAdmissionYear(rangeEnd)
  const byDate = toSnapshotSeries(analytics, rangeStart, rangeEnd)
  const previousYearByDate = alignPreviousYearSeries(analytics, byDate)
  const latest = byDate.at(-1)
  const previous = byDate.at(-2)
  const latestDelta = latest && previous ? latest.quantity - previous.quantity : 0
  const epgu = results.applications.methods.find((method) => method.id === 'epgu')?.current || 0
  const personalAccount = results.applications.methods.find((method) => method.id === 'personal-account')?.current || 0
  const inPerson = results.applications.methods.find((method) => method.id === 'in-person')?.current || 0

  return {
    ...quotaAnalytics,
    rangeStart,
    rangeEnd,
    rangeText: results.source.periodLabel,
    applicationsTotal: results.applications.total,
    applicationsPerApplicant: analytics.total > 0 ? results.applications.total / analytics.total : 0,
    byApplicationForm: results.applications.estimatedForms.map(({ name, value }) => ({ name, quantity: value })),
    byDate,
    previousYearByDate,
    previousYearComparison: analytics.previousYearComparison.previousPeriodText
      ? {
        ...analytics.previousYearComparison,
        previousPeriodText: formatDateRange(shiftUtcDateYears(rangeStart, -1), shiftUtcDateYears(rangeEnd, -1)),
      }
      : analytics.previousYearComparison,
    latestDate: latest ? fullDate(latest.date) : 'Нет данных',
    latestQuantity: latest?.quantity ?? 0,
    latestDelta,
    latestDeltaPercent: previous?.quantity ? latestDelta / previous.quantity * 100 : 0,
    byMethod: toMethodRows('current'),
    byPriority: results.applications.priorities.map((row) => ({
      name: `Приоритет ${row.name}`,
      priority: Number(row.name),
      quantity: row.value,
    })),
    previousYearByMethod: toMethodRows('previous'),
    online: epgu + personalAccount,
    personal: inPerson,
    web: 0,
    topSpecialties: toSpecialtyRows(results.demand.topApplications),
    bottomSpecialties: toSpecialtyRows(results.demand.lowestApplications),
  }
}
