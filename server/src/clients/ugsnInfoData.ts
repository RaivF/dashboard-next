import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

type XmlRecord = Record<string, unknown>
type WorksheetRow = string[]

export type UgsnInfoColumn = {
  key: string
  group: string
  label: string
}

export type UgsnInfoRow = {
  key: string
  label: string
  values: Record<string, number | null>
}

export type UgsnInfoTable = {
  title: string
  sheet: string
  sourceFile: string
  columns: UgsnInfoColumn[]
  rows: UgsnInfoRow[]
}

export type UgsnInfoSheet = {
  name: string
  rows: string[][]
  columnCount: number
}

export type UgsnInfoWorkbook = {
  sourceFile: string
  sheets: UgsnInfoSheet[]
}

const XLSX_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const DEFAULT_TABLE: UgsnInfoTable = {
  title: 'Свод из UGSN_INFO',
  sheet: 'Свод',
  sourceFile: 'UGSN_INFO.xlsx',
  columns: [],
  rows: [],
}
const DEFAULT_WORKBOOK: UgsnInfoWorkbook = {
  sourceFile: 'UGSN_INFO.xlsx',
  sheets: [],
}
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})
const cache = new Map<string, { modifiedAt: number; table: UgsnInfoTable }>()
const workbookCache = new Map<string, { modifiedAt: number; workbook: UgsnInfoWorkbook }>()

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

function cleanCell(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/preserve\b/g, '')
    .trim()
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

function getWorksheetInfos(zip: AdmZip): Array<{ name: string; path: string }> {
  const workbook = parser.parse(getZipText(zip, 'xl/workbook.xml'))
  const workbookRels = parser.parse(getZipText(zip, 'xl/_rels/workbook.xml.rels'))
  const workbookRoot = isXmlRecord(workbook) ? workbook : {}
  const workbookNode = isXmlRecord(workbookRoot.workbook) ? workbookRoot.workbook : {}
  const sheetsNode = isXmlRecord(workbookNode.sheets) ? workbookNode.sheets : {}
  const relsRoot = isXmlRecord(workbookRels) ? workbookRels : {}
  const relationshipsNode = isXmlRecord(relsRoot.Relationships) ? relsRoot.Relationships : {}
  const relationships = asArray(relationshipsNode.Relationship)
    .filter(isXmlRecord)

  return asArray(sheetsNode.sheet)
    .filter(isXmlRecord)
    .map((sheet, index) => {
      const relId = sheet[`@_${XLSX_REL_NS}:id`] || sheet['@_r:id']
      const relationship = relationships.find((item) => item['@_Id'] === relId)

      return {
        name: cleanCell(sheet['@_name']) || `Лист ${index + 1}`,
        path: normalizeTargetPath(relationship?.['@_Target'] || `worksheets/sheet${index + 1}.xml`),
      }
    })
}

function getCellValue(cell: XmlRecord, sharedStrings: string[]): string {
  const type = cell['@_t']

  if (type === 's') {
    return sharedStrings[Number(cell.v)] ?? ''
  }

  if (type === 'inlineStr') {
    const inlineString = isXmlRecord(cell.is) ? cell.is : {}
    return normalizeXmlText(inlineString.t ?? cell.is)
  }

  return cell.v === undefined || cell.v === null ? '' : String(cell.v)
}

function readWorksheetRows(zip: AdmZip, sharedStrings: string[], worksheetPath: string): WorksheetRow[] {
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
      values[index] = cleanCell(getCellValue(cell, sharedStrings))
    })

    return values.map((value) => value ?? '')
  })
}

function parseNumber(value: unknown): number | null {
  const cleaned = cleanCell(value)
  if (!cleaned) return null

  const normalized = cleaned.replace(/\s+/g, '').replace(',', '.')
  const number = Number(normalized)

  return Number.isFinite(number) ? number : null
}

function normalizeColumns(groupRow: WorksheetRow, labelRow: WorksheetRow): UgsnInfoColumn[] {
  let currentGroup = ''

  return labelRow.slice(1).map((label, index) => {
    const sourceIndex = index + 1
    const group = cleanCell(groupRow[sourceIndex])
    if (group) currentGroup = group

    return {
      key: `col_${sourceIndex}`,
      group: currentGroup,
      label: cleanCell(label) || `Колонка ${sourceIndex + 1}`,
    }
  })
}

function buildTableFromRows(sourceFile: string, sheet: string, rows: WorksheetRow[]): UgsnInfoTable {
  const [groupRow = [], labelRow = [], ...dataRows] = rows
  const columns = normalizeColumns(groupRow, labelRow)
  const normalizedRows = dataRows
    .map((row, rowIndex) => {
      const label = cleanCell(row[0])

      return {
        key: label || `row_${rowIndex}`,
        label,
        values: Object.fromEntries(columns.map((column, index) => [
          column.key,
          parseNumber(row[index + 1]),
        ])),
      }
    })
    .filter((row) => row.label)

  return {
    title: 'Свод по формам обучения',
    sheet,
    sourceFile,
    columns,
    rows: normalizedRows,
  }
}

function normalizeWorkbookRows(rows: WorksheetRow[]): string[][] {
  const lastContentRow = rows.reduce((lastIndex, row, index) => (
    row.some((cell) => cleanCell(cell)) ? index : lastIndex
  ), -1)

  return rows.slice(0, lastContentRow + 1).map((row) => row.map(cleanCell))
}

function buildWorkbook(filePath: string): UgsnInfoWorkbook {
  const zip = new AdmZip(filePath)
  const sharedStrings = getSharedStrings(zip)
  const worksheets = getWorksheetInfos(zip)
  const sheets = worksheets.map((worksheet) => {
    const rows = normalizeWorkbookRows(readWorksheetRows(zip, sharedStrings, worksheet.path))
    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

    return {
      name: worksheet.name,
      rows,
      columnCount,
    }
  })

  return {
    sourceFile: path.basename(filePath),
    sheets,
  }
}

export function loadUgsnInfoWorkbook(rootDir: string): UgsnInfoWorkbook {
  const filePath = path.join(rootDir, 'DATA', 'UGSN_INFO.xlsx')
  if (!existsSync(filePath)) return DEFAULT_WORKBOOK

  const modifiedAt = statSync(filePath).mtimeMs
  const cached = workbookCache.get(filePath)
  if (cached?.modifiedAt === modifiedAt) return cached.workbook

  const workbook = buildWorkbook(filePath)
  workbookCache.set(filePath, { modifiedAt, workbook })

  return workbook
}

export function loadUgsnInfoTable(rootDir: string): UgsnInfoTable {
  const filePath = path.join(rootDir, 'DATA', 'UGSN_INFO.xlsx')
  if (!existsSync(filePath)) return DEFAULT_TABLE

  const modifiedAt = statSync(filePath).mtimeMs
  const cached = cache.get(filePath)
  if (cached?.modifiedAt === modifiedAt) return cached.table

  const workbook = loadUgsnInfoWorkbook(rootDir)
  const firstSheet = workbook.sheets[0]
  const table = firstSheet
    ? buildTableFromRows(workbook.sourceFile, firstSheet.name, firstSheet.rows)
    : DEFAULT_TABLE

  cache.set(filePath, { modifiedAt, table })

  return table
}
