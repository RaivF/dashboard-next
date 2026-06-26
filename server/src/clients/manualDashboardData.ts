import { existsSync } from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import type { ServerEnvironment } from '../types/environment.js'

type XmlRecord = Record<string, unknown>
type WorksheetRow = string[]
type ManualApplicantsByDate = {
  date: string
  quantity: number
  by_degree: Array<{
    name: string
    quantity: number
  }>
}
type ManualCategoryByDate = {
  date: string
  quantity: number
  categories: Array<{
    name: string
    quantity: number
  }>
}
type QuantityItem = {
  name: string
  quantity: number
  caption?: string
  code?: string
}
type ManualDashboardSummary = {
  applicationsTotal?: number
  onlineChannels?: number
}

const DEFAULT_MANUAL_DASHBOARD_FILE = 'manual-dashboard-data.xlsx'
const DEFAULT_MANUAL_PREVIOUS_DASHBOARD_FILE = 'manual-dashboard-data-2025.xlsx'
const XLSX_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const TOTAL_ROW_NAMES = new Set(['итого', 'всего', 'total'])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})

function isXmlRecord(value: unknown): value is XmlRecord {
  return typeof value === 'object' && value !== null
}

function asArray<T = unknown>(value: T | T[] | null | undefined): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function getZipText(zip: AdmZip, entryName: string): string {
  const entry = zip.getEntry(entryName)
  if (!entry) return ''
  return zip.readAsText(entry)
}

function normalizeXmlText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (!isXmlRecord(value)) return String(value)

  return Object.values(value)
    .map((item) => normalizeXmlText(item))
    .join('')
}

function getSharedStrings(zip: AdmZip): string[] {
  const sharedStringsXml = getZipText(zip, 'xl/sharedStrings.xml')
  if (!sharedStringsXml) return []

  const parsed = parser.parse(sharedStringsXml)
  const root = isXmlRecord(parsed) ? parsed : {}
  const sst = isXmlRecord(root.sst) ? root.sst : {}

  return asArray(sst.si).map((item) => {
    const record = isXmlRecord(item) ? item : {}
    return normalizeXmlText(record.t ?? record.r ?? item)
  })
}

function columnIndex(cellRef = ''): number {
  const letters = String(cellRef).match(/[A-Z]+/i)?.[0] || ''

  return [...letters.toUpperCase()].reduce((sum, letter) => (
    sum * 26 + letter.charCodeAt(0) - 64
  ), 0) - 1
}

function normalizeTargetPath(target: unknown): string {
  const value = String(target || '').replace(/\\/g, '/')
  if (value.startsWith('/')) return value.slice(1)
  if (value.startsWith('xl/')) return value
  return `xl/${value}`
}

function getWorksheetPath(zip: AdmZip, sheetName?: string): string | null {
  const workbook = parser.parse(getZipText(zip, 'xl/workbook.xml'))
  const workbookRels = parser.parse(getZipText(zip, 'xl/_rels/workbook.xml.rels'))
  const workbookRoot = isXmlRecord(workbook) ? workbook : {}
  const workbookNode = isXmlRecord(workbookRoot.workbook) ? workbookRoot.workbook : {}
  const sheetsNode = isXmlRecord(workbookNode.sheets) ? workbookNode.sheets : {}
  const sheets = asArray(sheetsNode.sheet).filter(isXmlRecord)
  const sheet = sheetName
    ? sheets.find((item) => cleanCell(item['@_name']) === sheetName)
    : sheets[0]
  if (!sheet) return null
  const relId = sheet?.[`@_${XLSX_REL_NS}:id`] || sheet?.['@_r:id']
  const relsRoot = isXmlRecord(workbookRels) ? workbookRels : {}
  const relationshipsNode = isXmlRecord(relsRoot.Relationships) ? relsRoot.Relationships : {}
  const relationship = asArray(relationshipsNode.Relationship)
    .filter(isXmlRecord)
    .find((item) => item['@_Id'] === relId)

  return relationship ? normalizeTargetPath(relationship['@_Target']) : null
}

function getCellValue(cell: XmlRecord, sharedStrings: string[]): string {
  const type = cell?.['@_t']

  if (type === 's') {
    return sharedStrings[Number(cell?.v)] ?? ''
  }

  if (type === 'inlineStr') {
    const inlineString = isXmlRecord(cell.is) ? cell.is : {}
    return normalizeXmlText(inlineString.t ?? cell.is)
  }

  return cell?.v === undefined || cell?.v === null ? '' : String(cell.v)
}

function readWorksheetRows(filePath: string, sheetName?: string): WorksheetRow[] {
  const zip = new AdmZip(filePath)
  const sharedStrings = getSharedStrings(zip)
  const worksheetPath = getWorksheetPath(zip, sheetName)
  if (!worksheetPath) return []
  const worksheet = parser.parse(getZipText(zip, worksheetPath))
  const worksheetRoot = isXmlRecord(worksheet) ? worksheet : {}
  const worksheetNode = isXmlRecord(worksheetRoot.worksheet) ? worksheetRoot.worksheet : {}
  const sheetData = isXmlRecord(worksheetNode.sheetData) ? worksheetNode.sheetData : {}

  return asArray(sheetData.row).map((row) => {
    const rowRecord = isXmlRecord(row) ? row : {}
    const values: string[] = []

    asArray(rowRecord.c).filter(isXmlRecord).forEach((cell) => {
      const index = columnIndex(String(cell['@_r'] || ''))
      if (index < 0) return
      values[index] = getCellValue(cell, sharedStrings)
    })

    return values.map((value) => (value === undefined ? '' : value))
  })
}

function cleanCell(value: unknown): string {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim()
}

function parseQuantity(value: unknown): number {
  const cleaned = cleanCell(value).replace(/\s+/g, '').replace(',', '.')
  if (!cleaned) return 0

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDateHeader(value: unknown, fallbackYear: number): string {
  const cleaned = cleanCell(value)
  if (!cleaned) return ''

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return cleaned

  const fullDateMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/)
  if (fullDateMatch) {
    const [, day, month, rawYear] = fullDateMatch
    const year = rawYear ? Number(rawYear.length === 2 ? `20${rawYear}` : rawYear) : fallbackYear
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const dayOnlyMatch = cleaned.match(/^(\d{1,2})(?:\s*число)?$/i)
  if (dayOnlyMatch) {
    return `${fallbackYear}-06-${dayOnlyMatch[1].padStart(2, '0')}`
  }

  return ''
}

function getFallbackYear(period: string | null | undefined): number {
  const year = Number(String(period || '').slice(0, 4))
  return Number.isFinite(year) && year > 0 ? year : new Date().getUTCFullYear()
}

function getPreviousFallbackYear(period: string | null | undefined): number {
  return getFallbackYear(period) - 1
}

function rowsToManualApplicantsByDate(rows: WorksheetRow[], fallbackYear: number): ManualApplicantsByDate[] {
  const [headerRow = [], ...dataRows] = rows
  const dateColumns = headerRow
    .map((header, index) => ({ date: parseDateHeader(header, fallbackYear), index }))
    .filter((item) => item.index > 0 && item.date)
  const days = new Map<string, ManualApplicantsByDate & { hasValue: boolean }>()

  dateColumns.forEach(({ date }) => {
    days.set(date, {
      date,
      quantity: 0,
      by_degree: [],
      hasValue: false,
    })
  })

  dataRows.forEach((row) => {
    const degree = cleanCell(row[0])
    if (!degree || TOTAL_ROW_NAMES.has(degree.toLowerCase())) return

    dateColumns.forEach(({ date, index }) => {
      const rawValue = cleanCell(row[index])
      const day = days.get(date)
      if (!day || rawValue === '') return

      const quantity = parseQuantity(rawValue)
      day.hasValue = true
      day.quantity += quantity

      if (quantity > 0) {
        day.by_degree.push({
          name: degree,
          quantity,
        })
      }
    })
  })

  return Array.from(days.values())
    .filter((day) => day.hasValue)
    .map((day) => ({
      date: day.date,
      quantity: day.quantity,
      by_degree: day.by_degree,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function rowsToManualCategoryByDate(rows: WorksheetRow[], fallbackYear: number): ManualCategoryByDate[] {
  const [headerRow = [], ...dataRows] = rows
  const dateColumns = headerRow
    .map((header, index) => ({ date: parseDateHeader(header, fallbackYear), index }))
    .filter((item) => item.index > 0 && item.date)
  const days = new Map<string, ManualCategoryByDate & { hasValue: boolean }>()

  dateColumns.forEach(({ date }) => {
    days.set(date, {
      date,
      quantity: 0,
      categories: [],
      hasValue: false,
    })
  })

  dataRows.forEach((row) => {
    const category = cleanCell(row[0])
    if (!category || TOTAL_ROW_NAMES.has(category.toLowerCase())) return

    dateColumns.forEach(({ date, index }) => {
      const rawValue = cleanCell(row[index])
      const day = days.get(date)
      if (!day || rawValue === '') return

      const quantity = parseQuantity(rawValue)
      day.hasValue = true
      day.quantity += quantity

      if (quantity > 0) {
        day.categories.push({
          name: category,
          quantity,
        })
      }
    })
  })

  return Array.from(days.values())
    .filter((day) => day.hasValue)
    .map((day) => ({
      date: day.date,
      quantity: day.quantity,
      categories: day.categories,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function rowsToQuantityItems(rows: WorksheetRow[]): QuantityItem[] {
  return rows.slice(1)
    .map((row) => {
      const hasStructuredColumns = cleanCell(row[3]) !== ''

      return {
        name: cleanCell(row[0]),
        code: hasStructuredColumns ? cleanCell(row[1]) : '',
        caption: hasStructuredColumns ? cleanCell(row[2]) : '',
        quantity: parseQuantity(hasStructuredColumns ? row[3] : row[1]),
      }
    })
    .filter((item) => item.name)
    .map((item) => ({
      name: item.name,
      quantity: item.quantity,
      ...(item.code ? { code: item.code } : {}),
      ...(item.caption ? { caption: item.caption } : {}),
    }))
}

function rowsToSummary(rows: WorksheetRow[]): ManualDashboardSummary {
  return Object.fromEntries(rows.slice(1)
    .map((row) => [cleanCell(row[0]), parseQuantity(row[1])])
    .filter(([key]) => key)) as ManualDashboardSummary
}

export function loadManualDashboardData(
  rootDir: string,
  period?: string | null,
  env: ServerEnvironment = process.env,
) {
  const workbookPath = env.MANUAL_DASHBOARD_XLSX_FILE
    ? path.resolve(rootDir, env.MANUAL_DASHBOARD_XLSX_FILE)
    : path.join(rootDir, 'DATA', DEFAULT_MANUAL_DASHBOARD_FILE)

  if (!existsSync(workbookPath)) return null

  const manualApplicantsByDate = rowsToManualApplicantsByDate(
    readWorksheetRows(workbookPath, 'Физ лица'),
    getFallbackYear(period),
  )
  const manualFundingByDate = rowsToManualCategoryByDate(
    readWorksheetRows(workbookPath, 'Основание обучения'),
    getFallbackYear(period),
  )
  const manualSummary = rowsToSummary(readWorksheetRows(workbookPath, 'Сводка'))
  const manualMethod = rowsToQuantityItems(readWorksheetRows(workbookPath, 'Способ подачи'))
  const manualTopSpecialties = rowsToQuantityItems(readWorksheetRows(workbookPath, 'Топ направлений'))
  const manualBottomSpecialties = rowsToQuantityItems(readWorksheetRows(workbookPath, 'Непопулярные направления'))

  return {
    manual_applicants_by_date: manualApplicantsByDate,
    manual_funding_by_date: manualFundingByDate,
    manual_summary: manualSummary,
    manual_method: manualMethod,
    manual_top_specialties: manualTopSpecialties,
    manual_bottom_specialties: manualBottomSpecialties,
    meta: {
      source: 'manual-xlsx',
      manualFile: path.basename(workbookPath),
    },
  }
}

export function loadManualPreviousYearDashboardData(
  rootDir: string,
  period?: string | null,
  env: ServerEnvironment = process.env,
) {
  const workbookPath = env.MANUAL_PREVIOUS_DASHBOARD_XLSX_FILE
    ? path.resolve(rootDir, env.MANUAL_PREVIOUS_DASHBOARD_XLSX_FILE)
    : path.join(rootDir, 'DATA', DEFAULT_MANUAL_PREVIOUS_DASHBOARD_FILE)

  if (!existsSync(workbookPath)) return null

  const manualApplicantsByDate = rowsToManualApplicantsByDate(
    readWorksheetRows(workbookPath, 'Физ лица'),
    getPreviousFallbackYear(period),
  )
  const manualFundingByDate = rowsToManualCategoryByDate(
    readWorksheetRows(workbookPath, 'Основание обучения'),
    getPreviousFallbackYear(period),
  )
  const manualMethod = rowsToQuantityItems(readWorksheetRows(workbookPath, 'Способ подачи'))

  return {
    manual_previous_year_applicants_by_date: manualApplicantsByDate,
    manual_previous_year_funding_by_date: manualFundingByDate,
    manual_previous_year_method: manualMethod,
    meta: {
      source: 'manual-xlsx',
      manualPreviousYearFile: path.basename(workbookPath),
    },
  }
}
