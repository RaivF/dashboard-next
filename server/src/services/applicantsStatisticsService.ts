import { buildMockResponse } from './mockData.js'
import { loadExcelApplicantsData } from '../clients/excelApplicantsData.js'
import {
  loadManualDashboardData,
  loadManualPreviousYearDashboardData,
} from '../clients/manualDashboardData.js'
import {
  appendPreviousYearData,
  buildFileYearResponse,
  loadPreviousYearData,
} from '../clients/previousYearData.js'
import type { ServerEnvironment } from '../types/environment.js'

export function getApplicantsStatistics(period: string | null, rootDir: string, env: ServerEnvironment) {
  const selectedYear = period ? Number(period.slice(0, 4)) : null
  const manualDashboardData = loadManualDashboardData(rootDir, period, env)
  const manualPreviousYearDashboardData = loadManualPreviousYearDashboardData(rootDir, period, env)

  if (selectedYear === 2025) {
    const previousYearData = loadPreviousYearData(rootDir, env)
    return buildFileYearResponse(previousYearData, period ?? undefined)
  }

  const excelApplicantsData = loadExcelApplicantsData(rootDir, env)

  if (excelApplicantsData) {
    const previousYearData = loadPreviousYearData(rootDir, env)
    const response = appendPreviousYearData(excelApplicantsData, previousYearData)

    if (!manualDashboardData) {
      return response
    }

    return {
      ...response,
      ...manualDashboardData,
      ...manualPreviousYearDashboardData,
      meta: {
        ...excelApplicantsData.meta,
        manualFile: manualDashboardData.meta.manualFile,
        manualPreviousYearFile: manualPreviousYearDashboardData?.meta.manualPreviousYearFile,
      },
    }
  }

  if (manualDashboardData) {
    return {
      applicants_statistics: [],
      applicants_quantity: 0,
      previous_year_statistics: [],
      ...manualDashboardData,
      ...manualPreviousYearDashboardData,
      meta: {
        source: 'manual-xlsx',
        note: 'Данные dashboard загружены из ручной Excel-таблицы.',
        manualFile: manualDashboardData.meta.manualFile,
        manualPreviousYearFile: manualPreviousYearDashboardData?.meta.manualPreviousYearFile,
      },
    }
  }

  return buildMockResponse(period || undefined)
}
