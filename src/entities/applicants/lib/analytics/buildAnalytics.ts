import { formatNumber, formatPercent } from '../../../../shared/lib/formatters.js'
import { ONLINE_METHOD_LABEL } from './constants.js'
import { countUniqueApplicants, numberValue } from './normalizers.js'
import { formatDateRange, fullDate } from './format.js'
import { filterItemsByRange, getRangeWindow } from './range.js'
import { buildChartSeries } from './chartSeries.js'
import { groupApplicantsByDate, groupBy, groupByFunding, groupByMethod, groupBySpecialty, groupPriority, isFirstPriority, isRankedSpecialty, sortByQuantityDesc } from './grouping.js'
import { buildPreviousYearChartSeries, buildPreviousYearComparison, getPreviousYearWindow } from './previousYear.js'
import { normalizeAdmissionControlNumbers } from './kcp.js'
import type { AnalyticsResult, ChartRange } from './types.js'
import { getApplicantsStatistics, isAnalyticsRecord } from './types.js'

export function buildAnalytics(
  response: unknown,
  range: ChartRange = 'all',
  selectedDate: Date | null = null,
): AnalyticsResult {
  const allItems = getApplicantsStatistics(response)
  const responseRecord = isAnalyticsRecord(response) ? response : {}
  const rangeWindow = getRangeWindow(allItems, range, selectedDate)
  const items = filterItemsByRange(allItems, range, selectedDate)
  const applicationTotal = items.reduce((sum, item) => sum + numberValue(item.quantity), 0)
  const uniqueApplicants = countUniqueApplicants(items) || (range === 'all' ? numberValue(responseRecord.applicants_quantity) : 0)
  const total = uniqueApplicants
  const applicationsPerApplicant = uniqueApplicants ? applicationTotal / uniqueApplicants : 0
  const admissionCampaignTotal = countUniqueApplicants(allItems)
  // КЦП относится ко всей приёмной кампании, поэтому этот блок не должен зависеть от выбранного периода.
  const kcp = normalizeAdmissionControlNumbers(response, admissionCampaignTotal, allItems)
  const previousYearComparison = buildPreviousYearComparison(response, rangeWindow)
  previousYearComparison.current = total
  previousYearComparison.delta = total - previousYearComparison.previous
  previousYearComparison.deltaPercent = previousYearComparison.previous
    ? (previousYearComparison.delta / previousYearComparison.previous) * 100
    : 0
  previousYearComparison.value = previousYearComparison.previous
    ? `${previousYearComparison.deltaPercent > 0 ? '+' : ''}${formatPercent(previousYearComparison.deltaPercent)}`
    : 'Нет данных'
  previousYearComparison.caption = previousYearComparison.previous
    ? `${previousYearComparison.delta > 0 ? 'на ' + formatNumber(previousYearComparison.delta) + ' поступающих больше' : previousYearComparison.delta < 0 ? 'на ' + formatNumber(Math.abs(previousYearComparison.delta)) + ' поступающих меньше' : 'столько же поступающих'}, чем за тот же период за прошлый год`
    : 'Нет данных за прошлый год'
  const analyticsPreviousYearComparison = {
    ...previousYearComparison,
    value: previousYearComparison.value,
  }
  const actualByDate = groupApplicantsByDate(items)
  const byDate = buildChartSeries(items, rangeWindow.startDate, rangeWindow.endDate, range)
  const previousYearByDate = buildPreviousYearChartSeries(response, byDate, range)
  const previousYearWindowItems = getPreviousYearWindow(response, rangeWindow).items
  const byFunding = groupByFunding(items)
  const previousYearByFunding = groupByFunding(previousYearWindowItems)
  const byForm = groupBy(items, 'form_of_education')
  const previousYearByForm = groupBy(previousYearWindowItems, 'form_of_education')
  const byDegree = groupBy(items, 'degree_type')
  const byMethod = groupByMethod(items)
  const previousYearByMethod = groupByMethod(previousYearWindowItems)
  const byPriority = groupPriority(items)
  const bySpecialty = groupBySpecialty(items)
  const rankedSpecialties = bySpecialty.filter(isRankedSpecialty)
  const topSpecialties = [...rankedSpecialties].sort(sortByQuantityDesc).slice(0, 5)
  const firstPrioritySpecialties = groupBySpecialty(items.filter(isFirstPriority))
    .filter(isRankedSpecialty)
    .filter((item) => item.quantity > 0)
    .sort(sortByQuantityDesc)
    .slice(0, 5)
  const bottomSpecialties = [...rankedSpecialties]
    .filter((item) => item.quantity > 0)
    .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name, 'ru'))
    .slice(0, 5)
  const latest = actualByDate.at(-1)
  const previous = actualByDate.at(-2)
  const latestDelta = latest && previous ? latest.quantity - previous.quantity : 0
  const latestDeltaPercent = previous?.quantity ? (latestDelta / previous.quantity) * 100 : 0
  const budget = byFunding.find((item) => item.name === 'Бюджетная основа')?.quantity || 0
  const paid = byFunding.find((item) => item.name === 'Платное обучение' || item.name === 'Договор на платное обучение')?.quantity || 0
  const target = byFunding.find((item) => item.name === 'Целевой прием' || item.name === 'Целевой приём')?.quantity || 0
  const web = byMethod.find((item) => item.name === 'Веб')?.quantity || 0
  const online = byMethod.find((item) => item.name === ONLINE_METHOD_LABEL)?.quantity || 0
  const personal = byMethod.find((item) => item.name === 'Лично')?.quantity || 0

  return {
    items,
    allItems,
    applicationsTotal: applicationTotal,
    rangeStart: rangeWindow.startDate,
    rangeEnd: rangeWindow.endDate,
    rangeText: formatDateRange(rangeWindow.startDate, rangeWindow.endDate),
    total,
    uniqueApplicants,
    applicationsPerApplicant,
    kcp,
    latestDate: latest ? fullDate(latest.date) : 'Нет данных',
    latestQuantity: latest?.quantity || 0,
    latestDelta,
    latestDeltaPercent,
    previousYearComparison: analyticsPreviousYearComparison,
    budget,
    paid,
    target,
    web,
    online,
    personal,
    byDate,
    previousYearByDate,
    byFunding,
    previousYearByFunding,
    byForm,
    previousYearByForm,
    byDegree,
    byMethod,
    previousYearByMethod,
    byPriority,
    firstPrioritySpecialties,
    topSpecialties,
    bottomSpecialties,
    source: isAnalyticsRecord(responseRecord.meta) ? String(responseRecord.meta.source || 'local') : 'local',
    sourceNote: isAnalyticsRecord(responseRecord.meta) ? String(responseRecord.meta.note || '') : '',
  }
}
