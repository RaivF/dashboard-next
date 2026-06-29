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
  <cols><col min="1" max="1" width="42" customWidth="1"/><col min="2" max="12" width="18" customWidth="1"/></cols>
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
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-06-29T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-06-29T00:00:00Z</dcterms:modified>
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

writeWorkbook(path.resolve('DATA/manual-dashboard-data.xlsx'), [
  {
    name: 'Физ лица',
    rows: [
      ['Уровень', '20.06.2026', '21.06.2026', '22.06.2026', '23.06.2026', '24.06.2026', '25.06.2026', '26.06.2026', '27.06.2026'],
      ['Аспирантура', '', '', '', '', '', '', '', ''],
      ['ВО', 132, 0, 141, 119, 176, 118, 125, 88],
      ['СПО', '', '', '', '', '', '', '', ''],
      ['Итого', 132, 0, 141, 119, 176, 118, 125, 88],
    ],
  },
  {
    name: 'Основание обучения',
    rows: [
      ['Категория', '20.06.2026', '21.06.2026', '22.06.2026', '23.06.2026', '24.06.2026', '25.06.2026', '26.06.2026', '27.06.2026', '28.06.2026', '29.06.2026'],
      ['Бюджетная основа', 437, 30, 381, 406, 471, 367, 345, 309, 40, 269],
      ['Платное обучение', 15, 11, 11, 14, 15, 8, 17, 14, 12, 5],
      ['Целевая квота', '', '', '', '', '', 1, '', '', '', ''],
      ['Отдельная квота', 14, 4, 2, 2, 7, 7, 7, 2, 11, ''],
      ['Особая квота', 21, 3, 10, 1, 14, 6, 7, 2, '', 11],
      ['Итого', 487, 48, 404, 423, 507, 389, 376, 327, 63, 285],
    ],
  },
  {
    name: 'Сводка',
    rows: [
      ['Ключ', 'Значение'],
      ['applicationsTotal', 3309],
      ['onlineChannels', 448],
    ],
  },
  {
    name: 'Способ подачи',
    rows: [
      ['Название', 'Количество'],
      ['Онлайн', 448],
      ['Очно', 2861],
    ],
  },
  {
    name: 'Топ направлений',
    rows: [
      ['Название', 'Код', 'Подпись', 'Количество'],
      ['Юриспруденция', '5.40.03.01', 'Код: 5.40.03.01', 468],
      ['Экономика', '5.38.03.01', 'Код: 5.38.03.01', 232],
      ['Педагогическое образование (с двумя профилями подготовки)', '6.44.03.05', 'Код: 6.44.03.05', 185],
      ['Государственное и муниципальное управление', '5.38.03.04', 'Код: 5.38.03.04', 144],
      ['Судебная и прокурорская деятельность', '5.40.05.04', 'Код: 5.40.05.04', 132],
    ],
  },
  {
    name: 'Непопулярные направления',
    rows: [
      ['Название', 'Код', 'Подпись', 'Количество'],
      ['Организация работы с молодежью', '5.39.04.03', 'Код: 5.39.04.03', 1],
      ['Технологические машины и оборудование', '2.15.04.02', 'Код: 2.15.04.02', 1],
      ['История', '7.46.04.01', 'Код: 7.46.04.01', 2],
      ['Культурология', '8.51.04.01', 'Код: 8.51.04.01', 2],
      ['Садоводство', '4.35.04.05', 'Код: 4.35.04.05', 2],
    ],
  },
])

writeWorkbook(path.resolve('DATA/manual-dashboard-data-2025.xlsx'), [
  {
    name: 'Физ лица',
    rows: [
      ['Уровень', '20.06.2025', '21.06.2025', '22.06.2025', '23.06.2025', '24.06.2025', '25.06.2025', '26.06.2025', '27.06.2025'],
      ['Аспирантура', '', '', '', '', '', '', '', ''],
      ['ВО', 196, 67, 0, 145, 170, 181, 120, 80],
      ['СПО', '', '', '', '', '', '', '', ''],
      ['Итого', 196, 67, 0, 145, 170, 181, 120, 80],
    ],
  },
  {
    name: 'Основание обучения',
    rows: [
      ['Категория', '20.06.2025', '21.06.2025', '22.06.2025', '23.06.2025', '24.06.2025', '25.06.2025', '26.06.2025', '27.06.2025'],
      ['Бюджетная основа', 175, 52, 0, 130, 192, 159, '', ''],
      ['Платное обучение', 21, 15, 0, 15, 29, 22, '', ''],
      ['Целевая квота', '', '', '', '', '', '', '', ''],
      ['Отдельная квота', '', '', '', '', '', '', '', ''],
      ['Особая квота', '', '', '', '', '', '', '', ''],
      ['Итого', 196, 67, 0, 145, 221, 181, 120, 80],
    ],
  },
])
