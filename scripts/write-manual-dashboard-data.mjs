import fs from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

function shiftDateString(value, days) {
  const [day, month, year] = String(value).split('.').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))

  return [
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCFullYear()),
  ].join('.')
}

function cellXml(value, rowIndex, columnIndex) {
  if (value === '') return ''

  const ref = `${columnName(columnIndex)}${rowIndex + 1}`

  if (typeof value === 'number') {
    return `<c r="${ref}"><v>${value}</v></c>`
  }

  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
}

function sheetXml(rows) {
  const rowXml = rows.map((row, rowIndex) => (
    `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(value, rowIndex, columnIndex)).join('')}</row>`
  )).join('')
  const lastCol = columnName(Math.max(...rows.map((row) => row.length)) - 1)

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${lastCol}${rows.length}"/>
  <cols><col min="1" max="1" width="42" customWidth="1"/><col min="2" max="32" width="18" customWidth="1"/></cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`
}

function writeWorkbook(outputPath, sheets) {
  const zip = new AdmZip()

  zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n  ')}
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`))
  zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`))
  zip.addFile('docProps/core.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Manual dashboard data</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-07T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-07T00:00:00Z</dcterms:modified>
</cp:coreProperties>`))
  zip.addFile('docProps/app.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>`))
  zip.addFile('xl/workbook.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets>
</workbook>`))
  zip.addFile('xl/_rels/workbook.xml.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('\n  ')}
</Relationships>`))

  sheets.forEach((sheet, index) => {
    zip.addFile(`xl/worksheets/sheet${index + 1}.xml`, Buffer.from(sheetXml(sheet.rows)))
  })

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  zip.writeZip(outputPath)
}

const currentPeopleDates = [
  '20.06.2026',
  '22.06.2026',
  '23.06.2026',
  '24.06.2026',
  '25.06.2026',
  '26.06.2026',
  '27.06.2026',
  '29.06.2026',
  '30.06.2026',
  '01.07.2026',
  '02.07.2026',
  '03.07.2026',
  '04.07.2026',
  '06.07.2026',
  '07.07.2026',
  '08.07.2026',
  '09.07.2026',
  '10.07.2026',
  '11.07.2026',
  '13.07.2026',
  '14.07.2026',
  '15.07.2026',
  '16.07.2026',
  '17.07.2026',
  '18.07.2026',
  '20.07.2026',
  '21.07.2026',
  '22.07.2026',
  '29.07.2026',
  '30.07.2026',
  '31.07.2026',
  '03.08.2026',
  '04.08.2026',
  '05.08.2026',
  '06.08.2026',
  '07.08.2026',
]
const currentPeople = [132, 141, 119, 176, 118, 125, 88, 200, 236, 211, 216, 360, 134, 241, 194, 129, 169, 153, 111, 237, 218, 221, 205, 198, 95, 373, 25, 10, 139, 47, 14, 37, -2, 25, 8, 0]
const previousPeopleSource = [
  ['20.06.2025', 196],
  ['21.06.2025', 67],
  ['23.06.2025', 145],
  ['24.06.2025', 221],
  ['25.06.2025', 181],
  ['26.06.2025', 189],
  ['27.06.2025', 189],
  ['28.06.2025', 109],
  ['30.06.2025', 308],
  ['01.07.2025', 296],
  ['02.07.2025', 206],
  ['03.07.2025', 286],
  ['04.07.2025', 235],
  ['05.07.2025', 125],
  ['07.07.2025', 253],
  ['08.07.2025', 244],
  ['09.07.2025', 217],
  ['10.07.2025', 211],
  ['11.07.2025', 241],
  ['12.07.2025', 101],
  ['14.07.2025', 284],
  ['15.07.2025', 206],
  ['16.07.2025', 240],
  ['17.07.2025', 258],
  ['18.07.2025', 153],
  ['19.07.2025', 135],
  ['21.07.2025', 74],
  ['23.07.2025', 84],
  ['24.07.2025', 26],
  ['25.07.2025', 22],
  ['26.07.2025', 8],
  ['28.07.2025', 34],
  ['29.07.2025', 0],
  ['30.07.2025', 86],
  ['31.07.2025', 52],
  ['01.08.2025', 21],
  ['02.08.2025', 13],
  ['04.08.2025', 58],
  ['05.08.2025', 101],
  ['06.08.2025', 72],
  ['07.08.2025', 87],
  ['08.08.2025', 86],
  ['11.08.2025', 116],
]
const previousPeopleDates = previousPeopleSource.map(([date]) => shiftDateString(date, -1))
const previousPeople = previousPeopleSource.map(([, quantity]) => quantity)

const fundingDates = ['20.06.2026', '21.06.2026', '22.06.2026', '23.06.2026', '24.06.2026', '25.06.2026', '26.06.2026', '27.06.2026', '28.06.2026', '29.06.2026', '30.06.2026', '01.07.2026', '02.07.2026', '03.07.2026', '04.07.2026', '05.07.2026', '06.07.2026', '07.07.2026']
const previousFundingDates = fundingDates.map((date) => date.replace('2026', '2025'))
const previousFundingBudget = [139, 14, 119, 75, 153, 106, 130, 64, 4, 194, 174, 241, 78, 270, 126, 8, 226, 221]
const previousFundingPaid = [6, 1, 7, 2, 4, 3, 9, 1, 0, 5, 7, 4, 3, 10, 2, 1, 12, 2]
const previousFundingTarget = [0, 0, 1, 0, 2, 0, 1, 0, 0, 1, 0, 2, 0, 1, 0, 0, 2, 0]
const previousFundingSeparate = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1]
const previousFundingSpecial = [1, 0, 2, 0, 1, 0, 3, 0, 0, 1, 2, 0, 1, 0, 2, 0, 1, 1]
const previousFundingTotals = previousFundingBudget.map(
  (quantity, index) =>
    quantity +
    previousFundingPaid[index] +
    previousFundingTarget[index] +
    previousFundingSeparate[index] +
    previousFundingSpecial[index],
)

writeWorkbook(path.resolve('DATA/manual-dashboard-data.xlsx'), [
  {
    name: 'Физ лица',
    rows: [
      ['Уровень', ...currentPeopleDates],
      ['Аспирантура', ...currentPeopleDates.map(() => '')],
      ['ВО', ...currentPeople],
      ['СПО', ...currentPeopleDates.map(() => '')],
      ['Итого', ...currentPeople],
    ],
  },
  {
    name: 'Основание обучения',
    rows: [
      ['Категория', '20.06.2026', '21.06.2026', '22.06.2026', '23.06.2026', '24.06.2026', '25.06.2026', '26.06.2026', '27.06.2026', '28.06.2026', '29.06.2026', '30.06.2026', '01.07.2026', '02.07.2026', '03.07.2026', '04.07.2026', '05.07.2026', '06.07.2026', '07.07.2026'],
      ['Бюджетная основа', 457, 33, 392, 442, 499, 395, 359, 323, 51, 770, 842, 775, 772, 518, 409, 30, 591, 123],
      ['Платное обучение', 17, 11, 12, 14, 16, 10, 23, 14, 12, 49, 44, 29, 45, 18, 26, 17, 30, 5],
      ['Целевая квота', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Отдельная квота', 14, 4, 2, 2, 9, 7, 8, 2, 12, 7, 21, 28, 29, 5, 11, 4, 11, ''],
      ['Особая квота', 21, 3, 10, 1, 14, 10, 7, 3, '', 26, 38, 19, 31, 3, 15, 7, 13, 5],
      ['Итого', 509, 51, 416, 459, 538, 422, 397, 342, 75, 852, 945, 851, 877, 544, 461, 58, 645, 133],
    ],
  },
  {
    name: 'Сводка',
    rows: [
      ['Ключ', 'Значение'],
      ['applicationsTotal', 16767],
      ['onlineChannels', 3629],
    ],
  },
  {
    name: 'Способ подачи',
    rows: [
      ['Название', 'Количество'],
      ['Онлайн', 3629],
      ['Очно', 13138],
    ],
  },
  {
    name: 'Топ направлений',
    rows: [
      ['Название', 'Код', 'Подпись', 'Количество'],
      ['Юриспруденция', '40.03.01', 'Код: 40.03.01', 1137],
      ['Экономика', '38.03.01', 'Код: 38.03.01', 686],
      ['Педагогическое образование (с двумя профилями подготовки)', '44.03.05', 'Код: 44.03.05', 472],
      ['Судебная и прокурорская деятельность', '40.05.04', 'Код: 40.05.04', 328],
      ['Государственное и муниципальное управление', '38.03.04', 'Код: 38.03.04', 297],
    ],
  },
  {
    name: 'Непопулярные направления',
    rows: [
      ['Название', 'Код', 'Подпись', 'Количество'],
      ['Социология', '39.04.01', 'Код: 39.04.01', 1],
      ['4.3.2 Электротехнологии, электрооборудование и энергоснабжение агропромышленного комплекса', '', '', 2],
      ['Гидромелиорация', '35.04.10', 'Код: 35.04.10', 2],
      ['Журналистика', '42.04.02', 'Код: 42.04.02', 2],
      ['Культурология', '51.04.01', 'Код: 51.04.01', 2],
    ],
  },
])

writeWorkbook(path.resolve('DATA/manual-dashboard-data-2025.xlsx'), [
  {
    name: 'Физ лица',
    rows: [
      ['Уровень', ...previousPeopleDates],
      ['Аспирантура', ...previousPeopleDates.map(() => '')],
      ['ВО', ...previousPeople],
      ['СПО', ...previousPeopleDates.map(() => '')],
      ['Итого', ...previousPeople],
    ],
  },
  {
    name: 'Основание обучения',
    rows: [
      ['Категория', ...previousFundingDates],
      ['Бюджетная основа', ...previousFundingBudget],
      ['Платное обучение', ...previousFundingPaid],
      ['Целевая квота', ...previousFundingTarget],
      ['Отдельная квота', ...previousFundingSeparate],
      ['Особая квота', ...previousFundingSpecial],
      ['Итого', ...previousFundingTotals],
    ],
  },
])
