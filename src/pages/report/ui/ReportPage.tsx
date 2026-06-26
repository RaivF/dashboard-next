import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Landmark,
  Table2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReport20252026 } from '../../../entities/report/model/useReport20252026.js'
import { formatNumber } from '../../../shared/lib/formatters.js'

type ReportNamedQuantity = {
  name: string
  quantity: number
  note?: string
}

type ReportPlanRow = {
  name: string
  total: number
  kcp: number
  growthPercent: number
  kcpDelta: number
}

type ReportDirectionRow = {
  level: string
  name: string
  total: number
  kcp: number
}

type ReportContextItem = {
  name: string
  value: number
  note?: string
}

type GraduationRow = {
  name: string
  summer: number
  winter: number
  total: number
}

type GraduationLevel = GraduationRow & {
  rows: GraduationRow[]
}

type UgsnInfoColumn = {
  key: string
  group: string
  label: string
}

type UgsnInfoRow = {
  key: string
  label: string
  values: Record<string, number | null>
}

type UgsnInfoTable = {
  title: string
  sheet: string
  sourceFile: string
  columns: UgsnInfoColumn[]
  rows: UgsnInfoRow[]
}

type UgsnWorkbookSheet = {
  name: string
  rows: string[][]
  columnCount: number
}

type UgsnInfoWorkbook = {
  sourceFile: string
  sheets: UgsnWorkbookSheet[]
}

type Report20252026 = {
  title: string
  source: string
  ugsnInfo?: UgsnInfoTable
  ugsnWorkbook?: UgsnInfoWorkbook
  admissionCampaign: {
    year: string
    programsTotal: number
    programBreakdown: ReportNamedQuantity[]
    enrolledTotal2025?: number
    enrolledKcp2025: ReportNamedQuantity[]
    admission2025Top: ReportDirectionRow[]
    plan2026: ReportPlanRow[]
    plan2026Top: ReportDirectionRow[]
    context: ReportContextItem[]
  }
  graduation: {
    year: string
    total: number
    summer: {
      title: string
      quantity: number
      description?: string
    }
    winter: {
      title: string
      quantity: number
      description?: string
    }
    levels: GraduationLevel[]
  }
}

type DetailRow = {
  name: string
  value?: number | string
  caption?: string
  meta?: string
  detail?: DetailPayload
}

type DetailPayload = {
  title: string
  subtitle?: string
  total?: number | string
  totalLabel?: string
  rows?: DetailRow[]
  emptyText?: string
}

type ActivationEvent = KeyboardEvent<HTMLElement> | ReactMouseEvent<HTMLElement>
type DetailOpenHandler = (detail: DetailPayload, source?: HTMLElement | null) => void
type DetailPopoverStyle = CSSProperties & {
  '--detail-popover-left'?: string
  '--detail-popover-right'?: string
  '--detail-popover-top'?: string
}

type ClickableProps = {
  className: string
  ariaLabel: string
  onClick: (event: ActivationEvent) => void
  children: ReactNode
  as?: 'article' | 'div'
}

type ReportMetricProps = {
  label: string
  value: number | string
  caption?: string
  tone?: string
  icon?: LucideIcon
  onClick?: (event: ActivationEvent) => void
}

type KcpYearValues = {
  fullTime: number
  partTime: number
  distance: number
}

type KcpComparisonRow = {
  level: string
  actual2025: KcpYearValues
  plan2026: KcpYearValues
}

type KcpCollegeRow = {
  name: string
  base: number
  additional: number
  note: string
}

type KcpYearKey = 'actual2025' | 'plan2026'

const KCP_2025_ACTUAL_ADMISSION_TOTAL = 5339

const KCP_COMPARISON_ROWS: KcpComparisonRow[] = [
  {
    level: 'Бакалавриат',
    actual2025: { fullTime: 1518, partTime: 380, distance: 449 },
    plan2026: { fullTime: 2221, partTime: 370, distance: 267 },
  },
  {
    level: 'Специалитет',
    actual2025: { fullTime: 127, partTime: 0, distance: 50 },
    plan2026: { fullTime: 205, partTime: 0, distance: 65 },
  },
  {
    level: 'Магистратура',
    actual2025: { fullTime: 687, partTime: 15, distance: 391 },
    plan2026: { fullTime: 1064, partTime: 45, distance: 421 },
  },
  {
    level: 'СПО',
    actual2025: { fullTime: 500, partTime: 0, distance: 0 },
    plan2026: { fullTime: 650, partTime: 0, distance: 0 },
  },
  {
    level: 'Аспирантура',
    actual2025: { fullTime: 50, partTime: 0, distance: 0 },
    plan2026: { fullTime: 105, partTime: 0, distance: 0 },
  },
]

const KCP_COLLEGE_ROWS: KcpCollegeRow[] = [
  {
    name: 'Энергодарский колледж',
    base: 100,
    additional: 50,
    note: 'СПО: 100 на базе 9 классов + 50 на базе 11 классов',
  },
  {
    name: 'Васильевский колледж',
    base: 225,
    additional: 50,
    note: 'СПО: 225 на базе 9 классов + 50 на базе 11 классов',
  },
  {
    name: 'Бердянский колледж',
    base: 225,
    additional: 0,
    note: 'СПО: 225 на базе 9 классов',
  },
]

function getPercent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function formatValue(value: number | string | undefined) {
  if (typeof value === 'number') return formatNumber(value)
  return value || ''
}

function normalizeReportLabel(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU')
}

function getKcpRowTotal(values: KcpYearValues) {
  return values.fullTime + values.partTime + values.distance
}

function getKcpYearTotal(rows: KcpComparisonRow[], year: KcpYearKey) {
  return rows.reduce((sum, row) => sum + getKcpRowTotal(row[year]), 0)
}

function getKcpColumnTotal(rows: KcpComparisonRow[], year: KcpYearKey, column: keyof KcpYearValues) {
  return rows.reduce((sum, row) => sum + row[year][column], 0)
}

function getKcpCollegeTotal(rows: KcpCollegeRow[]) {
  return rows.reduce((sum, row) => sum + row.base + row.additional, 0)
}

function formatKcpCell(value: number) {
  return value ? formatNumber(value) : '—'
}

function getContingentTotal(table?: UgsnInfoTable): number {
  if (!table) return 0

  return table.rows.reduce((sum, row) => (
    sum + table.columns.reduce((rowSum, column) => (
      normalizeReportLabel(column.label) === 'всего' ? rowSum + (row.values[column.key] || 0) : rowSum
    ), 0)
  ), 0)
}

function getSheetHeaderRowCount(sheet: UgsnWorkbookSheet): number {
  const secondRow = sheet.rows[1] || []
  return secondRow.some((cell) => cell === 'Всего' || cell === 'Контракт') ? 2 : 1
}

function normalizeWorkbookRow(row: string[], columnCount: number) {
  return Array.from({ length: columnCount }, (_item, index) => row[index] || '')
}

function getFirstFilledColumn(row: string[], columnCount: number) {
  const index = normalizeWorkbookRow(row, columnCount).findIndex(Boolean)
  return index < 0 ? columnCount : index
}

function getDetailPopoverStyle(source?: HTMLElement | null): DetailPopoverStyle {
  if (!source || typeof window === 'undefined') return {}

  const rect = source.getBoundingClientRect()
  const margin = 16
  const gap = 10
  const popoverWidth = Math.min(440, window.innerWidth - margin * 2)
  const left = Math.min(Math.max(rect.left, margin), window.innerWidth - popoverWidth - margin)
  const topLimit = Math.max(margin, window.innerHeight - 180)
  const top = Math.min(Math.max(rect.bottom + gap, margin), topLimit)

  return {
    '--detail-popover-left': `${Math.round(left)}px`,
    '--detail-popover-right': 'auto',
    '--detail-popover-top': `${Math.round(top)}px`,
  }
}

function keyOpen(handler: (event: ActivationEvent) => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handler(event)
  }
}

function ClickableBlock({ className, ariaLabel, onClick, children, as = 'article' }: ClickableProps) {
  const Tag = as

  return (
    <Tag
      className={`${className} report-clickable`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={keyOpen(onClick)}
    >
      {children}
    </Tag>
  )
}

function ReportDetailPanel({
  detail,
  popoverStyle,
  onClose,
  onOpenDetail,
}: {
  detail: DetailPayload
  popoverStyle?: DetailPopoverStyle
  onClose: () => void
  onOpenDetail: DetailOpenHandler
}) {
  const rows = detail.rows || []

  return (
    <aside className="report-detail-popover" role="dialog" aria-modal="false" aria-label={detail.title} style={popoverStyle}>
      <button className="report-detail-popover__close" type="button" aria-label="Закрыть" onClick={onClose}>
        <X size={22} strokeWidth={2.4} />
      </button>
      <header>
        <span>{detail.totalLabel || 'Расшифровка'}</span>
        <h2>{detail.title}</h2>
        {detail.total !== undefined && <strong>{formatValue(detail.total)}</strong>}
        {detail.subtitle && <p>{detail.subtitle}</p>}
      </header>

      {rows.length > 0 ? (
        <div className="report-detail-list">
          {rows.map((row, index) => {
            const rowContent = (
              <>
                <div>
                  <span>{row.name}</span>
                  {row.caption && <small>{row.caption}</small>}
                  {row.meta && <small>{row.meta}</small>}
                </div>
                {row.value !== undefined && <strong>{formatValue(row.value)}</strong>}
              </>
            )

            if (!row.detail) {
              return (
                <div className="report-detail-list__row" key={`${row.name}-${index}`}>
                  {rowContent}
                </div>
              )
            }

            return (
              <div
                className="report-detail-list__row report-detail-list__row--clickable"
                key={`${row.name}-${index}`}
                role="button"
                tabIndex={0}
                aria-label={`Открыть детализацию ${row.name}`}
                onClick={(event) => row.detail && onOpenDetail(row.detail, event.currentTarget)}
                onKeyDown={keyOpen((event) => row.detail && onOpenDetail(row.detail, event.currentTarget))}
              >
                {rowContent}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="report-detail-empty">
          {detail.emptyText || 'Детализация для этого показателя будет добавлена позже.'}
        </div>
      )}
    </aside>
  )
}

function UgsnWorkbookModal({
  workbook,
  contingentTotal,
  activeSheetIndex,
  onSheetChange,
  onClose,
}: {
  workbook: UgsnInfoWorkbook
  contingentTotal: number
  activeSheetIndex: number
  onSheetChange: (index: number) => void
  onClose: () => void
}) {
  const sheet = workbook.sheets[activeSheetIndex] || workbook.sheets[0]
  const headerRowCount = sheet ? getSheetHeaderRowCount(sheet) : 0
  const headerRows = sheet?.rows.slice(0, headerRowCount) || []
  const bodyRows = sheet?.rows.slice(headerRowCount) || []
  const columnCount = Math.max(sheet?.columnCount || 0, 1)
  const firstHeaderRow = headerRows[0] || []
  const leadingColumns = headerRowCount === 2 ? getFirstFilledColumn(firstHeaderRow, columnCount) : 0
  const hasGroupedHeader = headerRowCount === 2

  const goToPreviousSheet = () => {
    onSheetChange(activeSheetIndex === 0 ? workbook.sheets.length - 1 : activeSheetIndex - 1)
  }
  const goToNextSheet = () => {
    onSheetChange(activeSheetIndex === workbook.sheets.length - 1 ? 0 : activeSheetIndex + 1)
  }

  return (
    <div className="report-workbook-backdrop" role="presentation" onClick={onClose}>
      <section
        className="report-workbook-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Контингент обучающихся"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="report-workbook-modal__header">
          <div>
            <span>{workbook.sourceFile}</span>
            <h2>Контингент обучающихся</h2>
            <p>{workbook.sheets.length} листов Excel-документа</p>
          </div>
          <button className="report-workbook-modal__close" type="button" aria-label="Закрыть" onClick={onClose}>
            <X size={22} strokeWidth={2.4} />
          </button>
        </header>

        <div className="report-workbook-modal__toolbar">
          <button type="button" aria-label="Предыдущий лист" onClick={goToPreviousSheet}>
            <ChevronLeft size={20} />
          </button>
          <div className="report-workbook-modal__tabs" role="tablist" aria-label="Листы Excel">
            {workbook.sheets.map((item, index) => (
              <button
                className={`report-workbook-modal__tab${index === activeSheetIndex ? ' report-workbook-modal__tab--active' : ''}`}
                key={item.name}
                type="button"
                role="tab"
                aria-selected={index === activeSheetIndex}
                onClick={() => onSheetChange(index)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Следующий лист" onClick={goToNextSheet}>
            <ChevronRight size={20} />
          </button>
        </div>

        {sheet ? (
          <div className="report-workbook-modal__sheet">
            <div className="report-workbook-modal__sheet-title">
              <span>Лист {activeSheetIndex + 1} из {workbook.sheets.length}</span>
              <strong>{sheet.name}</strong>
            </div>
            <div className="report-workbook-table-wrap">
              <table className={[
                'report-workbook-table',
                hasGroupedHeader ? 'report-workbook-table--grouped' : '',
                leadingColumns >= 2 || (!hasGroupedHeader && columnCount <= 4) ? 'report-workbook-table--wide-labels' : '',
              ].filter(Boolean).join(' ')}
              >
                <thead>
                  {hasGroupedHeader ? (
                    <>
                      <tr>
                        {Array.from({ length: leadingColumns }, (_item, index) => (
                          <th className="report-workbook-table__leading" key={`leading-${index}`} rowSpan={2}>
                            {firstHeaderRow[index] || ''}
                          </th>
                        ))}
                        {(() => {
                          const cells = []
                          let columnIndex = leadingColumns
                          const normalizedFirstRow = normalizeWorkbookRow(firstHeaderRow, columnCount)

                          while (columnIndex < columnCount) {
                            const label = normalizedFirstRow[columnIndex]
                            let span = 1
                            while (
                              columnIndex + span < columnCount &&
                              !normalizedFirstRow[columnIndex + span]
                            ) {
                              span += 1
                            }
                            cells.push(
                              <th className="report-workbook-table__group" colSpan={span} key={`group-${columnIndex}`}>
                                {label}
                              </th>,
                            )
                            columnIndex += span
                          }

                          return cells
                        })()}
                      </tr>
                      <tr>
                        {normalizeWorkbookRow(headerRows[1] || [], columnCount)
                          .slice(leadingColumns)
                          .map((cell, index) => (
                            <th key={`subhead-${index}`}>{cell}</th>
                          ))}
                      </tr>
                    </>
                  ) : (
                    headerRows.map((row, rowIndex) => (
                      <tr key={`head-${rowIndex}`}>
                        {normalizeWorkbookRow(row, columnCount).map((cell, columnIndex) => (
                          <th key={`head-${rowIndex}-${columnIndex}`}>{cell || `Колонка ${columnIndex + 1}`}</th>
                        ))}
                      </tr>
                    ))
                  )}
                </thead>
                <tbody>
                  {bodyRows.map((row, rowIndex) => (
                    <tr key={`${sheet.name}-${rowIndex}`}>
                      {normalizeWorkbookRow(row, columnCount).map((cell, columnIndex) => (
                        <td key={`${sheet.name}-${rowIndex}-${columnIndex}`}>
                          {cell || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="report-workbook-table__total-row" scope="row" colSpan={columnCount}>
                      <span className="report-workbook-table__total-label">Итого обучающихся</span>
                      <strong className="report-workbook-table__total-value">{formatNumber(contingentTotal)}</strong>
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="report-detail-empty">В Excel-файле нет доступных листов.</div>
        )}
      </section>
    </div>
  )
}

function KcpComparisonModal({
  rows,
  collegeRows,
  onClose,
}: {
  rows: KcpComparisonRow[]
  collegeRows: KcpCollegeRow[]
  onClose: () => void
}) {
  const total2025 = getKcpYearTotal(rows, 'actual2025')
  const total2026 = getKcpYearTotal(rows, 'plan2026')
  const collegeTotal = getKcpCollegeTotal(collegeRows)
  const columns: Array<{ key: keyof KcpYearValues; label: string }> = [
    { key: 'fullTime', label: 'очная' },
    { key: 'partTime', label: 'очно-заочная' },
    { key: 'distance', label: 'заочная' },
  ]

  return (
    <div className="report-kcp-backdrop" role="presentation" onClick={onClose}>
      <section
        className="report-kcp-modal"
        role="dialog"
        aria-modal="true"
        aria-label="КЦП 2025"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="report-kcp-modal__header">
          <div>
            <span>Контрольные цифры приёма</span>
            <h2>КЦП 2025</h2>
            <p>Факт 2025 и план 2026 по уровням и формам обучения.</p>
          </div>
          <strong>{formatNumber(total2025)}</strong>
          <button className="report-kcp-modal__close" type="button" aria-label="Закрыть" onClick={onClose}>
            <X size={22} strokeWidth={2.4} />
          </button>
        </header>

        <div className="report-kcp-modal__summary" aria-label="Итоги КЦП">
          <div>
            <span>Было КЦП</span>
            <strong>{formatNumber(99999)}</strong>
          </div>
          <div>
            <span>Было принято</span>
            <strong>{formatNumber(99999)}</strong>
          </div>
        </div>

        <div className="report-kcp-table-wrap">
          <table className="report-kcp-table">
            <colgroup>
              <col className="report-kcp-table__col-level" />
              <col className="report-kcp-table__col-row-total" />
              {Array.from({ length: 7 }, (_item, index) => (
                <col className="report-kcp-table__col-value" key={`kcp-col-${index}`} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>Уровень</th>
                <th rowSpan={2}>Итого</th>
                <th colSpan={3}>2025</th>
                <th colSpan={4}>2026</th>
              </tr>
              <tr>
                {columns.map((column) => <th key={`2025-${column.key}`}>{column.label}</th>)}
                {columns.map((column) => <th key={`2026-${column.key}`}>{column.label}</th>)}
                <th>всего</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.level}>
                  <th scope="row">{row.level}</th>
                  <td className="report-kcp-table__row-total">{formatNumber(getKcpRowTotal(row.actual2025))}</td>
                  {columns.map((column) => (
                    <td key={`${row.level}-2025-${column.key}`}>{formatKcpCell(row.actual2025[column.key])}</td>
                  ))}
                  {columns.map((column) => (
                    <td key={`${row.level}-2026-${column.key}`}>{formatKcpCell(row.plan2026[column.key])}</td>
                  ))}
                  <td className="report-kcp-table__total">{formatNumber(getKcpRowTotal(row.plan2026))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Итого</th>
                <td>{formatNumber(total2025)}</td>
                {columns.map((column) => (
                  <td key={`total-2025-${column.key}`}>{formatNumber(getKcpColumnTotal(rows, 'actual2025', column.key))}</td>
                ))}
                {columns.map((column) => (
                  <td key={`total-2026-${column.key}`}>{formatNumber(getKcpColumnTotal(rows, 'plan2026', column.key))}</td>
                ))}
                <td>{formatNumber(total2026)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="report-kcp-colleges" aria-label="КЦП СПО по колледжам">
          <div className="report-kcp-colleges__header">
            <div>
              <span>Дополнение</span>
              <h3>СПО по колледжам</h3>
            </div>
            <strong>{formatNumber(collegeTotal)}</strong>
          </div>
          <div className="report-kcp-colleges__grid">
            {collegeRows.map((row) => {
              const rowTotal = row.base + row.additional

              return (
                <div className="report-kcp-colleges__row" key={row.name}>
                  <div>
                    <span>{row.name}</span>
                    <small>{row.note}</small>
                  </div>
                  <strong>{formatNumber(rowTotal)}</strong>
                </div>
              )
            })}
          </div>
        </section>
      </section>
    </div>
  )
}

function ReportMetric({ label, value, caption, tone = 'blue', icon: Icon, onClick }: ReportMetricProps) {
  const content = (
    <>
      {Icon && (
        <span className="report-metric__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      {label && <span>{label}</span>}
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      {caption && <p>{caption}</p>}
    </>
  )

  if (!onClick) {
    return (
      <article className={`report-metric report-metric--${tone}`}>
        {content}
      </article>
    )
  }

  return (
    <ClickableBlock
      className={`report-metric report-metric--${tone}`}
      ariaLabel={`Показать состав показателя ${label}`}
      onClick={onClick}
    >
      {content}
    </ClickableBlock>
  )
}

function GraduationTable({
  level,
  onOpen,
}: {
  level: GraduationLevel
  onOpen: DetailOpenHandler
}) {
  const sortedRows = [...level.rows].sort((first, second) => second.total - first.total)

  return (
    <section className="panel report-table-panel">
      <div className="panel__header">
        <div>
          <h2>{level.name}</h2>
          <p>Летний и зимний выпуск по укрупнённым группам</p>
        </div>
        <button
          className="report-table-total"
          type="button"
          onClick={(event) =>
            onOpen({
              title: level.name,
              total: level.total,
              rows: [
                { name: 'Летний выпуск', value: level.summer },
                { name: 'Зимний выпуск', value: level.winter },
              ],
            }, event.currentTarget)
          }
        >
          <span>Всего</span>
          <strong>{formatNumber(level.total)}</strong>
        </button>
      </div>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>УГСН</th>
              <th>Летний</th>
              <th>Зимний</th>
              <th>Всего</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((item) => (
              <tr
                className="report-table__clickable-row"
                key={`${level.name}-${item.name}`}
                role="button"
                tabIndex={0}
                aria-label={`Показать состав выпуска ${item.name}`}
                onClick={(event) =>
                  onOpen({
                    title: item.name,
                    total: item.total,
                    rows: [
                      { name: 'Летний выпуск', value: item.summer },
                      { name: 'Зимний выпуск', value: item.winter },
                    ],
                  }, event.currentTarget)
                }
                onKeyDown={keyOpen((event) =>
                  onOpen({
                    title: item.name,
                    total: item.total,
                    rows: [
                      { name: 'Летний выпуск', value: item.summer },
                      { name: 'Зимний выпуск', value: item.winter },
                    ],
                  }, event.currentTarget),
                )}
              >
                <td>{item.name}</td>
                <td>{formatNumber(item.summer)}</td>
                <td>{formatNumber(item.winter)}</td>
                <td>{formatNumber(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GraduationSection({
  graduation,
  openDetail,
}: {
  graduation: Report20252026['graduation']
  openDetail: DetailOpenHandler
}) {
  const summerPercent = getPercent(graduation.summer.quantity, graduation.total)
  const winterPercent = 100 - summerPercent
  const summerLevelRows = graduation.levels.map((level) => ({
    name: level.name,
    value: level.summer,
    caption: `${getPercent(level.summer, graduation.summer.quantity)}% летнего выпуска`,
    meta: `${getPercent(level.summer, graduation.total)}% от общего выпуска`,
  }))
  const winterLevelRows = graduation.levels.map((level) => ({
    name: level.name,
    value: level.winter,
    caption: `${getPercent(level.winter, graduation.winter.quantity)}% зимнего выпуска`,
    meta: `${getPercent(level.winter, graduation.total)}% от общего выпуска`,
  }))

  return (
    <section className="report-section report-section--primary">
      <div className="report-section__heading">
        <GraduationCap size={30} aria-hidden="true" />
        <div>
          <h2>Выпуск {graduation.year}</h2>
          <p>Разделение на летний выпуск очной формы и зимний выпуск очно-заочной/заочной формы.</p>
        </div>
      </div>

      <div className="report-graduation-chart">
        <ClickableBlock
          className="report-graduation-donut-panel"
          ariaLabel="Показать состав общего выпуска"
          onClick={(event) =>
            openDetail({
              title: `Выпуск ${graduation.year}`,
              total: graduation.total,
              rows: [
                {
                  name: graduation.winter.title,
                  value: graduation.winter.quantity,
                  caption: `${winterPercent}% от общего выпуска`,
                  meta: winterLevelRows
                    .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                    .join(' / '),
                },
                {
                  name: graduation.summer.title,
                  value: graduation.summer.quantity,
                  caption: `${summerPercent}% от общего выпуска`,
                  meta: summerLevelRows
                    .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                    .join(' / '),
                },
              ],
            }, event.currentTarget)
          }
        >
          <div
            className="report-graduation-donut"
            style={{ '--summer-share': `${summerPercent}%` } as CSSProperties}
            aria-label={`Летний выпуск ${formatNumber(graduation.summer.quantity)}, зимний выпуск ${formatNumber(graduation.winter.quantity)}`}
          >
            <div>
              <span>Итого</span>
              <strong>{formatNumber(graduation.total)}</strong>
            </div>
          </div>
          <div className="report-graduation-legend">
            <div
              className="report-graduation-legend__item report-graduation-legend__item--winter"
              onClick={(event) => event.stopPropagation()}
            >
              <span>{graduation.winter.title}</span>
              <strong>{formatNumber(graduation.winter.quantity)}</strong>
              <small>{winterPercent}%</small>
            </div>
            <div
              className="report-graduation-legend__item report-graduation-legend__item--summer"
              onClick={(event) => event.stopPropagation()}
            >
              <span>{graduation.summer.title}</span>
              <strong>{formatNumber(graduation.summer.quantity)}</strong>
              <small>{summerPercent}%</small>
            </div>
          </div>
        </ClickableBlock>

        <article className="report-graduation-levels">
          <header>
            <span>Структура выпуска</span>
            <strong>Бакалавры и магистры</strong>
            <p>Полоса показывает выпуск по периодам.</p>
          </header>
          <div className="report-graduation-levels__list">
            {graduation.levels.map((level) => {
              const levelSummerPercent = getPercent(level.summer, level.total)
              const levelWinterPercent = 100 - levelSummerPercent

              return (
                <ClickableBlock
                  as="div"
                  className="report-graduation-level"
                  key={level.name}
                  ariaLabel={`Показать состав выпуска ${level.name}`}
                  onClick={(event) =>
                    openDetail({
                      title: level.name,
                      total: level.total,
                      rows: [
                        {
                          name: 'Зимний выпуск',
                          value: level.winter,
                          caption: `${levelWinterPercent}% выпуска уровня`,
                          meta: `${getPercent(level.winter, graduation.winter.quantity)}% зимнего выпуска`,
                        },
                        {
                          name: 'Летний выпуск',
                          value: level.summer,
                          caption: `${levelSummerPercent}% выпуска уровня`,
                          meta: `${getPercent(level.summer, graduation.summer.quantity)}% летнего выпуска`,
                        },
                        ...level.rows.map((row) => ({ name: row.name, value: row.total })),
                      ],
                    }, event.currentTarget)
                  }
                >
                  <div className="report-graduation-level__header">
                    <span>{level.name}</span>
                    <strong>{formatNumber(level.total)}</strong>
                  </div>
                  <div
                    className="report-graduation-level__track"
                    aria-label={`${level.name}: ${formatNumber(level.total)}, летний выпуск ${formatNumber(level.summer)}, зимний выпуск ${formatNumber(level.winter)}`}
                  >
                    <span
                      className="report-graduation-level__bar report-graduation-level__bar--summer"
                      style={{ width: `${levelSummerPercent}%` }}
                    />
                    <span
                      className="report-graduation-level__bar report-graduation-level__bar--winter"
                      style={{ width: `${levelWinterPercent}%` }}
                    />
                  </div>
                  <div className="report-graduation-level__season-row" aria-label="Выпуск по периодам">
                    <span className="report-graduation-level__season report-graduation-level__season--winter">
                      <small>Зима</small>
                      <strong>{formatNumber(level.winter)}</strong>
                      <em>{levelWinterPercent}% уровня</em>
                    </span>
                    <span className="report-graduation-level__season report-graduation-level__season--summer">
                      <small>Лето</small>
                      <strong>{formatNumber(level.summer)}</strong>
                      <em>{levelSummerPercent}% уровня</em>
                    </span>
                  </div>
                </ClickableBlock>
              )
            })}
          </div>
        </article>
      </div>

      <div className="report-tables-grid">
        {graduation.levels.map((level) => (
          <GraduationTable key={level.name} level={level} onOpen={openDetail} />
        ))}
      </div>
    </section>
  )
}

function ReportLoading() {
  return (
    <section className="report-page">
      <div className="report-loading panel">
        <span />
        <span />
        <span />
      </div>
    </section>
  )
}

export default function ReportPage() {
  const { report: reportData, loading } = useReport20252026()
  const report = reportData as Report20252026 | null
  const [activeDetail, setActiveDetail] = useState<DetailPayload | null>(null)
  const [detailPopoverStyle, setDetailPopoverStyle] = useState<DetailPopoverStyle>({})
  const [isWorkbookOpen, setWorkbookOpen] = useState(false)
  const [isKcpModalOpen, setKcpModalOpen] = useState(false)
  const [activeWorkbookSheet, setActiveWorkbookSheet] = useState(0)

  const openDetail: DetailOpenHandler = (detail, source) => {
    setDetailPopoverStyle(getDetailPopoverStyle(source))
    setActiveDetail(detail)
  }

  const closeDetail = () => {
    setActiveDetail(null)
    setDetailPopoverStyle({})
  }

  useEffect(() => {
    if (!activeDetail && !isWorkbookOpen && !isKcpModalOpen) return undefined

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closeDetail()
      setWorkbookOpen(false)
      setKcpModalOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDetail, isWorkbookOpen, isKcpModalOpen])

  const reportMetrics = useMemo(() => {
    if (!report) return []

    const campaign = report.admissionCampaign

    return [
      {
        label: '',
        value: 108,
        caption: 'направления подготовки',
        tone: 'blue',
        icon: BookOpen,
        detail: {
          title: 'Программы приёма',
          total: campaign.programsTotal,
          rows: campaign.programBreakdown.map((item) => ({
            name: item.name,
            value: item.quantity,
            caption: 'направления подготовки',
          })),
        },
      },
    ]
  }, [report])

  if (loading && !report) return <ReportLoading />

  if (!report) return null

  const contingentTotal = getContingentTotal(report.ugsnInfo)
  const kcp2025Total = getKcpYearTotal(KCP_COMPARISON_ROWS, 'actual2025')
  const kcp2026Total = getKcpYearTotal(KCP_COMPARISON_ROWS, 'plan2026')
  const workbook = report.ugsnWorkbook

  return (
    <section className="report-page">
      <section className="report-metrics report-metrics--summary" aria-label="Ключевые показатели отчёта">
        {reportMetrics.map((item) => (
          <ReportMetric
            key={item.label}
            label={item.label}
            value={item.value}
            caption={item.caption}
            tone={item.tone}
            icon={item.icon}
            onClick={(event) => openDetail(item.detail, event.currentTarget)}
          />
        ))}
        <ReportMetric
          label="Результат приёмки 2025"
          value={KCP_2025_ACTUAL_ADMISSION_TOTAL}
          caption={`КЦП: ${formatNumber(kcp2025Total)}`}
          tone="cyan"
          icon={Landmark}
          onClick={() => setKcpModalOpen(true)}
        />
        <ReportMetric
          label="КЦП 2026"
          value={kcp2026Total}
          tone="green"
          icon={Landmark}
        />
        <ReportMetric
          label="Контингент обучающихся"
          value={contingentTotal || '—'}
          caption="контингент обучающихся по состоянию на 01.06.2025 г."
          tone="soft"
          icon={Table2}
          onClick={() => {
            setActiveWorkbookSheet(0)
            setWorkbookOpen(true)
          }}
        />
      </section>

      <GraduationSection
        graduation={report.graduation}
        openDetail={openDetail}
      />

      {isWorkbookOpen && workbook && (
        <UgsnWorkbookModal
          workbook={workbook}
          contingentTotal={contingentTotal}
          activeSheetIndex={activeWorkbookSheet}
          onSheetChange={setActiveWorkbookSheet}
          onClose={() => setWorkbookOpen(false)}
        />
      )}

      {isKcpModalOpen && (
        <KcpComparisonModal
          rows={KCP_COMPARISON_ROWS}
          collegeRows={KCP_COLLEGE_ROWS}
          onClose={() => setKcpModalOpen(false)}
        />
      )}

      {activeDetail && (
        <ReportDetailPanel
          detail={activeDetail}
          popoverStyle={detailPopoverStyle}
          onClose={closeDetail}
          onOpenDetail={openDetail}
        />
      )}
    </section>
  )
}
