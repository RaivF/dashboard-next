import { buildMockResponse } from './mockData.js'
import { loadExcelApplicantsData } from '../clients/excelApplicantsData.js'
import {
  appendPreviousYearData,
  buildFileYearResponse,
  loadPreviousYearData,
} from '../clients/previousYearData.js'
import type { ServerEnvironment } from '../types/environment.js'

export function getApplicantsStatistics(period: string | null, rootDir: string, env: ServerEnvironment) {
  const selectedYear = period ? Number(period.slice(0, 4)) : null

  if (selectedYear === 2025) {
    const previousYearData = loadPreviousYearData(rootDir, env)
    return buildFileYearResponse(previousYearData, period ?? undefined)
  }

  const excelApplicantsData = loadExcelApplicantsData(rootDir, env)

  if (excelApplicantsData) {
    const previousYearData = loadPreviousYearData(rootDir, env)
    return appendPreviousYearData(excelApplicantsData, previousYearData)
  }

  return buildMockResponse(period || undefined)
}
