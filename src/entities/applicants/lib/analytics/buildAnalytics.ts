import { formatNumber, formatPercent } from '../../../../shared/lib/formatters.js'
import { ONLINE_METHOD_LABEL } from './constants.js'
import { countUniqueApplicants, numberValue } from './normalizers.js'
import { formatDateRange, fullDate } from './format.js'
import { filterItemsByRange, getRangeWindow } from './range.js'
import { buildChartSeries } from './chartSeries.js'
import { groupApplicantsByDate, groupBy, groupByFunding, groupByMethod, groupBySpecialty, groupPriority, isFirstPriority, isRankedSpecialty, sortByQuantityDesc } from './grouping.js'
import { buildPreviousYearChartSeries, buildPreviousYearComparison, filterItemsByWindow, getPreviousYearWindow, shiftUtcDateYears } from './previousYear.js'
import { normalizeAdmissionControlNumbers } from './kcp.js'
import type { AnalyticsResult, ApplicantStatistic, ChartRange, ChartPoint } from './types.js'
import {
  getApplicantsStatistics,
  getManualApplicantsByDate,
  getManualBottomSpecialties,
  getManualFundingByDate,
  getManualMethod,
  getManualPreviousYearFundingByDate,
  getManualPreviousYearMethod,
  getManualSummary,
  getManualTopSpecialties,
  isAnalyticsRecord,
} from './types.js'

function getManualPeopleItems(response: unknown): ApplicantStatistic[] {
  return getManualApplicantsByDate(response)
    .map((item) => ({
      date: String(item.date || ''),
      quantity: numberValue(item.quantity),
    }))
    .filter((item) => item.date)
}

function getManualFundingItems(response: unknown, previousYear = false): ApplicantStatistic[] {
  const rows = previousYear ? getManualPreviousYearFundingByDate(response) : getManualFundingByDate(response)

  return rows.flatMap((row) => {
    if (!Array.isArray(row.categories)) return []

    return row.categories
      .filter(isAnalyticsRecord)
      .map((category) => ({
        date: String(row.date || ''),
        funding_type: category.name,
        quantity: numberValue(category.quantity),
      }))
      .filter((item) => item.date)
  })
}

function sumChartPointQuantities(points: ChartPoint[]): number {
  return points.reduce((sum, point) => sum + numberValue(point.quantity), 0)
}

export function buildAnalytics(
  response: unknown,
  range: ChartRange = 'all',
  selectedDate: Date | null = null,
): AnalyticsResult {
  const allItems = getApplicantsStatistics(response)
  const manualPeopleItems = getManualPeopleItems(response)
  const manualFundingItems = getManualFundingItems(response)
  const manualPreviousYearFundingItems = getManualFundingItems(response, true)
  const manualSummary = getManualSummary(response)
  const manualMethod = getManualMethod(response)
  const manualPreviousYearMethod = getManualPreviousYearMethod(response)
  const manualTopSpecialties = getManualTopSpecialties(response)
  const manualBottomSpecialties = getManualBottomSpecialties(response)
  const hasManualPeopleData = manualPeopleItems.length > 0
  const hasManualFundingData = manualFundingItems.length > 0
  const hasManualPreviousYearFundingData = manualPreviousYearFundingItems.length > 0
  const peopleSourceItems = hasManualPeopleData ? manualPeopleItems : allItems
  const responseRecord = isAnalyticsRecord(response) ? response : {}
  const rangeWindow = getRangeWindow(peopleSourceItems, range, selectedDate)
  const items = filterItemsByRange(allItems, range, selectedDate)
  const peopleItems = hasManualPeopleData
    ? filterItemsByRange(manualPeopleItems, range, selectedDate)
    : items
  const calculatedApplicationTotal = items.reduce((sum, item) => sum + numberValue(item.quantity), 0)
  const applicationTotal = numberValue(manualSummary.applicationsTotal) || calculatedApplicationTotal
  const actualByDate = groupApplicantsByDate(peopleItems)
  const byDate = buildChartSeries(peopleSourceItems, rangeWindow.startDate, rangeWindow.endDate, range)
  const manualPeopleTotal = hasManualPeopleData ? sumChartPointQuantities(actualByDate) : 0
  const uniqueApplicants = hasManualPeopleData
    ? manualPeopleTotal
    : countUniqueApplicants(items) || (range === 'all' ? numberValue(responseRecord.applicants_quantity) : 0)
  const total = uniqueApplicants
  const applicationsPerApplicant = !hasManualPeopleData && uniqueApplicants ? applicationTotal / uniqueApplicants : 0
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
  const previousYearByDate = buildPreviousYearChartSeries(response, byDate, range)
  const previousYearWindowItems = getPreviousYearWindow(response, rangeWindow).items
  const fundingItems = hasManualFundingData
    ? filterItemsByRange(manualFundingItems, range, selectedDate)
    : items
  const previousYearFundingItems = hasManualPreviousYearFundingData
    ? filterItemsByWindow(
      manualPreviousYearFundingItems,
      shiftUtcDateYears(rangeWindow.startDate, -1),
      shiftUtcDateYears(rangeWindow.endDate, -1),
    )
    : previousYearWindowItems
  const byFunding = groupByFunding(fundingItems)
  const previousYearByFunding = groupByFunding(previousYearFundingItems)
  const byForm = groupBy(items, 'form_of_education')
  const previousYearByForm = groupBy(previousYearWindowItems, 'form_of_education')
  const byDegree = groupBy(items, 'degree_type')
  const byMethod = manualMethod.length > 0 ? manualMethod : groupByMethod(items)
  const previousYearByMethod = manualPreviousYearMethod.length > 0
    ? manualPreviousYearMethod
    : groupByMethod(previousYearWindowItems)
  const byPriority = groupPriority(items)
  const bySpecialty = groupBySpecialty(items)
  const rankedSpecialties = bySpecialty.filter(isRankedSpecialty)
  const topSpecialties = manualTopSpecialties.length > 0
    ? manualTopSpecialties
    : [...rankedSpecialties].sort(sortByQuantityDesc).slice(0, 5)
  const firstPrioritySpecialties = groupBySpecialty(items.filter(isFirstPriority))
    .filter(isRankedSpecialty)
    .filter((item) => item.quantity > 0)
    .sort(sortByQuantityDesc)
    .slice(0, 5)
  const bottomSpecialties = manualBottomSpecialties.length > 0
    ? manualBottomSpecialties
    : [...rankedSpecialties]
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name, 'ru'))
      .slice(0, 5)
  const latest = actualByDate.at(-1)
  const previous = actualByDate.at(-2)
  const latestDelta = latest && previous ? latest.quantity - previous.quantity : 0
  const latestDeltaPercent = previous?.quantity ? (latestDelta / previous.quantity) * 100 : 0
  const budget = byFunding.find((item) => item.name === 'Бюджетная основа')?.quantity || 0
  const paid = byFunding.find((item) => item.name === 'Платное обучение' || item.name === 'Договор на платное обучение')?.quantity || 0
  const target = byFunding.find((item) => item.name === 'Целевая квота' || item.name === 'Целевой прием' || item.name === 'Целевой приём')?.quantity || 0
  const web = byMethod.find((item) => item.name === 'Веб')?.quantity || 0
  const online = numberValue(manualSummary.onlineChannels) || byMethod.find((item) => item.name === ONLINE_METHOD_LABEL)?.quantity || 0
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
