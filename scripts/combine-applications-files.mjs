import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

const XLSX_REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})

function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function getZipText(zip, entryName) {
  const entry = zip.getEntry(entryName)
  return entry ? zip.readAsText(entry) : ''
}

function normalizeXmlText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  if (!isRecord(value)) return String(value)

  return Object.values(value)
    .map((item) => normalizeXmlText(item))
    .join('')
}

function columnIndex(cellRef = '') {
  const letters = String(cellRef).match(/[A-Z]+/i)?.[0] || ''

  return [...letters.toUpperCase()].reduce(
    (sum, letter) => sum * 26 + letter.charCodeAt(0) - 64,
    0,
  ) - 1
}

function columnName(index) {
  let name = ''
  let number = index + 1

  while (number > 0) {
    const remainder = (number - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    number = Math.floor((number - 1) / 26)
  }

  return name
}

function normalizeTargetPath(target) {
  const value = String(target || '').replace(/\\/g, '/')
  if (value.startsWith('/')) return value.slice(1)
  if (value.startsWith('xl/')) return value
  return `xl/${value}`
}

function getSharedStrings(zip) {
  const parsed = parser.parse(getZipText(zip, 'xl/sharedStrings.xml'))
  const root = isRecord(parsed) ? parsed : {}
  const sst = isRecord(root.sst) ? root.sst : {}

  return asArray(sst.si).map((item) => {
    const record = isRecord(item) ? item : {}
    return normalizeXmlText(record.t ?? record.r ?? item)
  })
}

function getFirstWorksheetPath(zip) {
  const workbook = parser.parse(getZipText(zip, 'xl/workbook.xml'))
  const rels = parser.parse(getZipText(zip, 'xl/_rels/workbook.xml.rels'))
  const workbookRoot = isRecord(workbook) ? workbook : {}
  const workbookNode = isRecord(workbookRoot.workbook) ? workbookRoot.workbook : {}
  const sheetsNode = isRecord(workbookNode.sheets) ? workbookNode.sheets : {}
  const sheet = asArray(sheetsNode.sheet).find(isRecord)
  const relationshipId = sheet?.[`@_${XLSX_REL_NS}:id`] || sheet?.['@_r:id']
  const relsRoot = isRecord(rels) ? rels : {}
  const relsNode = isRecord(relsRoot.Relationships) ? relsRoot.Relationships : {}
  const relationship = asArray(relsNode.Relationship)
    .filter(isRecord)
    .find((item) => item['@_Id'] === relationshipId)

  return normalizeTargetPath(relationship?.['@_Target'] || 'worksheets/sheet1.xml')
}

function getCellValue(cell, sharedStrings) {
  if (cell['@_t'] === 's') return sharedStrings[Number(cell.v)] ?? ''
  if (cell['@_t'] === 'inlineStr') {
    const inlineString = isRecord(cell.is) ? cell.is : {}
    return normalizeXmlText(inlineString.t ?? cell.is)
  }

  return cell.v === undefined || cell.v === null ? '' : String(cell.v)
}

function readRows(filePath) {
  const zip = new AdmZip(filePath)
  const sharedStrings = getSharedStrings(zip)
  const worksheet = parser.parse(getZipText(zip, getFirstWorksheetPath(zip)))
  const root = isRecord(worksheet) ? worksheet : {}
  const worksheetNode = isRecord(root.worksheet) ? root.worksheet : {}
  const sheetData = isRecord(worksheetNode.sheetData) ? worksheetNode.sheetData : {}

  return asArray(sheetData.row).map((row) => {
    const values = []

    asArray(row.c).filter(isRecord).forEach((cell) => {
      const index = columnIndex(String(cell['@_r'] || ''))
      if (index >= 0) values[index] = getCellValue(cell, sharedStrings)
    })

    return values.map((value) => value ?? '')
  })
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cellXml(value, rowIndex, columnIndex) {
  if (value === '') return ''
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`
  const numericValue = Number(value)

  if (String(value).trim() !== '' && Number.isFinite(numericValue) && String(numericValue) === String(value)) {
    return `<c r="${ref}"><v>${numericValue}</v></c>`
  }

  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
}

function writeWorkbook(outputPath, rows) {
  const zip = new AdmZip()
  const lastColumn = columnName(Math.max(...rows.map((row) => row.length)) - 1)
  const sheetRows = rows.map((row, rowIndex) => (
    `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(value, rowIndex, columnIndex)).join('')}</row>`
  )).join('')

  zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`))
  zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`))
  zip.addFile('xl/workbook.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Applications" sheetId="1" r:id="rId1"/></sheets>
</workbook>`))
  zip.addFile('xl/_rels/workbook.xml.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`))
  zip.addFile('xl/worksheets/sheet1.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${rows.length}"/>
  <sheetData>${sheetRows}</sheetData>
</worksheet>`))

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  zip.writeZip(outputPath)
}

function csvValue(value) {
  const text = String(value ?? '')
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function getColumnSummary(rows, headers, columnName) {
  const index = headers.indexOf(columnName)
  if (index < 0) return {}

  return Object.fromEntries(rows.reduce((counts, row) => {
    const value = String(row[index] ?? '').trim() || 'Не указано'
    counts.set(value, (counts.get(value) || 0) + 1)
    return counts
  }, new Map()).entries())
}

const [outputDirectory, ...inputPaths] = process.argv.slice(2)

if (!outputDirectory || inputPaths.length === 0) {
  throw new Error('Usage: node scripts/combine-applications-files.mjs <output-directory> <input.xlsx...>')
}

const sources = inputPaths.map((filePath) => ({
  path: path.resolve(filePath),
  rows: readRows(path.resolve(filePath)),
}))
const [firstSource] = sources
const [headers = []] = firstSource.rows

if (headers.length === 0) throw new Error('The first workbook does not contain a header row.')

sources.forEach((source) => {
  const [sourceHeaders = []] = source.rows
  if (sourceHeaders.join('\u0000') !== headers.join('\u0000')) {
    throw new Error(`Column mismatch in ${path.basename(source.path)}.`)
  }
})

const rows = sources.flatMap((source) => source.rows.slice(1))
const outputPath = path.resolve(outputDirectory)

writeWorkbook(path.join(outputPath, 'combined_applications.xlsx'), [headers, ...rows])
fs.writeFileSync(
  path.join(outputPath, 'combined_applications.csv'),
  [headers, ...rows].map((row) => row.map(csvValue).join(';')).join('\r\n'),
  'utf8',
)

console.log(JSON.stringify({
  headers: headers.length,
  applications: rows.length,
  sources: sources.map((source) => ({ file: path.basename(source.path), applications: source.rows.length - 1 })),
  applicationMethods: getColumnSummary(rows, headers, 'Источник КГ'),
  educationForms: getColumnSummary(rows, headers, 'Форма обучения'),
  funding: getColumnSummary(rows, headers, 'Вид мест'),
}, null, 2))
