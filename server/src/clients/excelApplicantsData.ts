import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import type { ServerEnvironment } from '../types/environment.js'

type XmlRecord = Record<string, unknown>
type WorksheetRow = string[]
type HeaderRow = string[]
type NormalizedRow = Record<string, string>
type Specialty = {
  code: string
  name: string
}
type ApplicantStatistic = {
  applicant_code: string
  applicant_id: string
  applicant_name: string
  application_id: string
  application_method: string
  competition_group_id: string
  competition_id: string
  date: string
  degree_type: string
  education_program: string
  form_of_education: string
  funding_type: string
  priority: string
  quantity: number
  source: string
  specialty: Specialty
  status: string
}

const XLSX_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const DATE_COLUMNS = new Set([
  'Дата рождения',
  'Дата выдачи',
  'Дата регистрации',
  'Дата изменения',
  'Дата добавления КГ',
  'Время подачи/отзыва согласия',
  'Время отказа от зачисления',
])

const DEGREE_BY_CODE = new Map<string | undefined, string>([
  ['02', 'Среднее профессиональное образование'],
  ['03', 'Бакалавриат'],
  ['04', 'Магистратура'],
  ['05', 'Специалитет'],
  ['06', 'Аспирантура'],
])

const FUNDING_BY_PLACE_KIND = new Map([
  ['Основные места в рамках КЦП', 'Бюджетная основа'],
  ['Платные места', 'Платное обучение'],
  ['Особая квота', 'Особая квота'],
  ['Отдельная квота', 'Отдельная квота'],
  ['Целевая квота', 'Целевая квота'],
  ['Целевой прием', 'Целевая квота'],
  ['Целевой приём', 'Целевая квота'],
])

const APPLICATION_METHOD_BY_SOURCE = new Map([
  ['ЕПГУ', 'ЕПГУ'],
  ['Вуз', 'Лично'],
])

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
  const strings = asArray(sst.si)

  return strings.map((item) => {
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

function getFirstWorksheetPath(zip: AdmZip): string {
  const workbook = parser.parse(getZipText(zip, 'xl/workbook.xml'))
  const workbookRels = parser.parse(getZipText(zip, 'xl/_rels/workbook.xml.rels'))
  const workbookRoot = isXmlRecord(workbook) ? workbook : {}
  const workbookNode = isXmlRecord(workbookRoot.workbook) ? workbookRoot.workbook : {}
  const sheetsNode = isXmlRecord(workbookNode.sheets) ? workbookNode.sheets : {}
  const sheet = asArray(sheetsNode.sheet).find(isXmlRecord)
  const relId = sheet?.[`@_${XLSX_REL_NS}:id`] || sheet?.['@_r:id']
  const relsRoot = isXmlRecord(workbookRels) ? workbookRels : {}
  const relationshipsNode = isXmlRecord(relsRoot.Relationships) ? relsRoot.Relationships : {}
  const relationship = asArray(relationshipsNode.Relationship)
    .filter(isXmlRecord)
    .find((item) => item['@_Id'] === relId)

  return normalizeTargetPath(relationship?.['@_Target'] || 'worksheets/sheet1.xml')
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

function readWorksheetRows(filePath: string): WorksheetRow[] {
  const zip = new AdmZip(filePath)
  const sharedStrings = getSharedStrings(zip)
  const worksheetPath = getFirstWorksheetPath(zip)
  const worksheet = parser.parse(getZipText(zip, worksheetPath))
  const worksheetRoot = isXmlRecord(worksheet) ? worksheet : {}
  const worksheetNode = isXmlRecord(worksheetRoot.worksheet) ? worksheetRoot.worksheet : {}
  const sheetData = isXmlRecord(worksheetNode.sheetData) ? worksheetNode.sheetData : {}
  const rows = asArray(sheetData.row)

  return rows.map((row) => {
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

function excelSerialToDate(value: unknown): string {
  const serial = Number(value)
  if (!Number.isFinite(serial)) return ''

  const utcMs = Date.UTC(1899, 11, 30) + serial * 24 * 60 * 60 * 1000
  const date = new Date(utcMs)

  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().replace('.000Z', '')
}

function cleanCell(value: unknown): string {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim()
}

function readRowValue(row: WorksheetRow, headers: HeaderRow, name: string): string {
  const index = headers.indexOf(name)
  if (index < 0) return ''
  return cleanCell(row[index])
}

function normalizeHeaderRow(headerRow: WorksheetRow): HeaderRow {
  return headerRow.map((value) => cleanCell(value))
}

function normalizeDataRow(row: WorksheetRow, headers: HeaderRow): NormalizedRow {
  return Object.fromEntries(headers.map((header, index) => {
    const raw = cleanCell(row[index])
    const value = DATE_COLUMNS.has(header) && raw ? excelSerialToDate(raw) : raw

    return [header, value]
  }))
}

function normalizeSpecialty(value: unknown): Specialty {
  const cleaned = cleanCell(value)
  const match = cleaned.match(/^(?:\d+\.)?(\d{2}\.\d{2}\.\d{2})\s+(.+)$/)
  const code = match?.[1] || ''
  const name = match?.[2] || cleaned

  return {
    code,
    name,
  }
}

function degreeFromSpecialtyCode(code: string): string {
  const levelCode = String(code || '').match(/^\d{2}\.(\d{2})\.\d{2}$/)?.[1]
  return DEGREE_BY_CODE.get(levelCode) || 'Не указано'
}

function normalizeFunding(row: WorksheetRow, headers: HeaderRow): string {
  const placeKind = readRowValue(row, headers, 'Вид мест')
  const applicationKind = readRowValue(row, headers, 'Вид заявления')

  return FUNDING_BY_PLACE_KIND.get(placeKind) ||
    (applicationKind.toLowerCase().includes('плат') ? 'Платное обучение' : '') ||
    (applicationKind.toLowerCase().includes('бюджет') ? 'Бюджетная основа' : '') ||
    placeKind ||
    applicationKind
}

function normalizeApplicationMethod(source: string): string {
  return APPLICATION_METHOD_BY_SOURCE.get(source) || source
}

function rowToApplicantStatistic(row: WorksheetRow, headers: HeaderRow): ApplicantStatistic {
  const raw = normalizeDataRow(row, headers)
  const specialty = normalizeSpecialty(raw['НПС/УГСН'])

  return {
    date: raw['Дата регистрации'],
    funding_type: normalizeFunding(row, headers),
    form_of_education: raw['Форма обучения'],
    priority: raw['Приоритет'],
    degree_type: degreeFromSpecialtyCode(specialty.code),
    application_method: normalizeApplicationMethod(raw['Источник КГ'] || raw['Источник']),
    specialty,
    quantity: 1,
    applicant_id: raw['Id поступающего'],
    applicant_code: raw['Уникальный код поступающего'],
    applicant_name: raw['ФИО'],
    application_id: raw['Id заявления'],
    competition_group_id: raw['Id КГ'],
    competition_id: raw['Id конкурса'],
    education_program: raw['Обр.программа'],
    status: raw['Статус'],
    source: raw['Источник'],
  }
}

function findWorkbookPath(dataDir: string): string | null {
  if (!existsSync(dataDir)) return null

  const collectCandidates = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name)

      if (entry.isDirectory()) return collectCandidates(entryPath)
      if (!entry.isFile()) return []

      return [entryPath]
    })

  const candidates = collectCandidates(dataDir)
    .map((filePath) => ({
      filePath,
      name: path.basename(filePath),
      relativePath: path.relative(dataDir, filePath),
    }))
    .filter(({ name }) => /\.xlsx$/i.test(name))
    .filter(({ name }) => !name.startsWith('~$') && !name.startsWith('unique_people_'))
    .filter(({ name }) => !['UGSN_INFO.xlsx', 'manual-dashboard-data.xlsx', 'manual-dashboard-data-2025.xlsx'].includes(name))
    .sort((a, b) => {
      const aIsCombined = a.name === 'combined_applications.xlsx'
      const bIsCombined = b.name === 'combined_applications.xlsx'

      if (aIsCombined !== bIsCombined) return aIsCombined ? -1 : 1

      return a.relativePath.localeCompare(b.relativePath, 'ru')
    })

  if (candidates.length === 0) return null

  return candidates[0].filePath
}

export function isExcelApplicantsSourceEnabled(env: ServerEnvironment = process.env): boolean {
  return env.APPLICANTS_XLSX_SOURCE === 'true'
}

export function loadExcelApplicantsData(rootDir: string, env: ServerEnvironment = process.env) {
  if (!isExcelApplicantsSourceEnabled(env)) return null

  const dataDir = path.join(rootDir, 'DATA')
  const workbookPath = env.APPLICANTS_XLSX_FILE
    ? path.resolve(rootDir, env.APPLICANTS_XLSX_FILE)
    : findWorkbookPath(dataDir)

  if (!workbookPath || !existsSync(workbookPath)) return null

  const rows = readWorksheetRows(workbookPath)
  const [headerRow, ...dataRows] = rows
  const headers = normalizeHeaderRow(headerRow || [])
  const applicantsStatistics = dataRows
    .map((row) => rowToApplicantStatistic(row, headers))
    .filter((item) => item.date && item.applicant_id && item.application_id)

  return {
    applicants_statistics: applicantsStatistics,
    applicants_quantity: new Set(applicantsStatistics.map((item) => item.applicant_id)).size,
    previous_year_statistics: [],
    meta: {
      source: 'xlsx',
      note: 'Данные загружены из Excel в папке DATA.',
      file: path.basename(workbookPath),
    },
  }
}
