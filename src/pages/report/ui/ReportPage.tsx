import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Layers3,
  Target,
  Users,
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

type Report20252026 = {
  title: string
  source: string
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

type ClickableProps = {
  className: string
  ariaLabel: string
  onClick: () => void
  children: ReactNode
  as?: 'article' | 'div'
}

type ReportMetricProps = {
  label: string
  value: number | string
  caption?: string
  tone?: string
  icon?: LucideIcon
  onClick: () => void
}

function getPercent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function formatValue(value: number | string | undefined) {
  if (typeof value === 'number') return formatNumber(value)
  return value || ''
}

function shouldShowContextNote(note?: string) {
  return Boolean(note && !note.startsWith('96%'))
}

function getAdmissionPlanForGraduationLevel(levelName: string, admissionPlan: ReportPlanRow[]) {
  return admissionPlan.find((plan) => (
    (levelName === 'Бакалавры' && plan.name === 'Бакалавриат') ||
    (levelName === 'Магистры' && plan.name === 'Магистратура')
  ))
}

function keyOpen(handler: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handler()
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
  onClose,
  onOpenDetail,
}: {
  detail: DetailPayload
  onClose: () => void
  onOpenDetail: (detail: DetailPayload) => void
}) {
  const rows = detail.rows || []

  return (
    <aside className="report-detail-popover" role="dialog" aria-modal="false" aria-label={detail.title}>
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
                onClick={() => row.detail && onOpenDetail(row.detail)}
                onKeyDown={keyOpen(() => row.detail && onOpenDetail(row.detail))}
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

function ReportMetric({ label, value, caption, tone = 'blue', icon: Icon, onClick }: ReportMetricProps) {
  return (
    <ClickableBlock
      className={`report-metric report-metric--${tone}`}
      ariaLabel={`Показать состав показателя ${label}`}
      onClick={onClick}
    >
      {Icon && (
        <span className="report-metric__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <span>{label}</span>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      {caption && <p>{caption}</p>}
    </ClickableBlock>
  )
}

function MiniBarList({
  rows,
  total,
  valueKey,
  onOpen,
}: {
  rows: DetailRow[]
  total: number
  valueKey?: string
  onOpen: (row: DetailRow) => void
}) {
  return (
    <div className="report-mini-bars">
      {rows.map((row) => {
        const value = Number(row.value) || 0
        const percent = getPercent(value, total)

        return (
          <ClickableBlock
            as="div"
            className="report-mini-bar"
            key={row.name}
            ariaLabel={`Показать состав: ${row.name}`}
            onClick={() => onOpen(row)}
          >
            <div className="report-mini-bar__header">
              <span>{row.name}</span>
              <strong>{formatNumber(value)}</strong>
            </div>
            <div className="report-mini-bar__track" aria-label={`${valueKey || 'значение'} ${formatNumber(value)}`}>
              <span style={{ width: `${percent}%` }} />
            </div>
            {row.caption && <small>{row.caption}</small>}
          </ClickableBlock>
        )
      })}
    </div>
  )
}

function AdmissionTable({
  title,
  subtitle,
  rows,
  onOpen,
}: {
  title: string
  subtitle: string
  rows: ReportDirectionRow[]
  onOpen: (row: ReportDirectionRow) => void
}) {
  return (
    <section className="panel report-table-panel">
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>Уровень / УГСН</th>
              <th>Всего</th>
              <th>КЦП</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr
                className="report-table__clickable-row"
                key={`${title}-${item.level}-${item.name}`}
                role="button"
                tabIndex={0}
                aria-label={`Показать состав строки ${item.name}`}
                onClick={() => onOpen(item)}
                onKeyDown={keyOpen(() => onOpen(item))}
              >
                <td>
                  <span>{item.level}</span>
                  <small>{item.name}</small>
                </td>
                <td>{formatNumber(item.total)}</td>
                <td>{formatNumber(item.kcp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AdmissionSection({
  report,
  openDetail,
}: {
  report: Report20252026
  openDetail: (detail: DetailPayload) => void
}) {
  const campaign = report.admissionCampaign
  const programsRows = campaign.programBreakdown.map((item) => ({
    name: item.name,
    value: item.quantity,
    caption: 'образовательных программ',
  }))
  const enrolledKcpTotal = campaign.enrolledKcp2025.reduce((sum, item) => sum + item.quantity, 0)
  const enrolledTotal = campaign.enrolledTotal2025 ?? enrolledKcpTotal
  const planTotal = campaign.plan2026.reduce((sum, item) => sum + item.total, 0)
  const planKcpTotal = campaign.plan2026.reduce((sum, item) => sum + item.kcp, 0)

  const openRows = (title: string, total: number | string, rows: DetailRow[], subtitle?: string) => {
    openDetail({ title, subtitle, total, rows })
  }

  return (
    <section className="report-section">
      <div className="report-section__heading">
        <ClipboardList size={30} aria-hidden="true" />
        <div>
          <h2>Приёмная кампания {campaign.year}</h2>
          <p>Программы, зачисление, план набора и ориентиры из исходного доклада.</p>
        </div>
      </div>

      <div className="report-admission-grid">
        <section className="panel report-admission-panel">
          <div className="panel__header">
            <div>
              <h2>Программы приёма</h2>
              <p>Разбивка общего числа программ по уровням.</p>
            </div>
            <button
              className="report-panel-action"
              type="button"
              onClick={() => openRows('Программы приёма', campaign.programsTotal, programsRows)}
            >
              {formatNumber(campaign.programsTotal)}
            </button>
          </div>
          <MiniBarList
            rows={programsRows}
            total={campaign.programsTotal}
            onOpen={(row) =>
              openRows(row.name, row.value || 0, [], 'Пока нет списка конкретных программ внутри этого уровня.')
            }
          />
        </section>

        <section className="panel report-admission-panel">
          <div className="panel__header">
            <div>
              <h2>Зачисление 2025</h2>
              <p>Итог ВО и разложение КЦП по уровням.</p>
            </div>
            <button
              className="report-panel-action"
              type="button"
              onClick={() =>
                openRows('Зачислено ВО', enrolledTotal, [
                  ...campaign.enrolledKcp2025.map((item) => ({
                    name: item.name,
                    value: item.quantity,
                    caption: 'КЦП',
                  })),
                  {
                    name: 'Прочее зачисление',
                    value: enrolledTotal - enrolledKcpTotal,
                    caption: 'Платное и другие категории без детальной разбивки в текущих данных',
                  },
                ])
              }
            >
              {formatNumber(enrolledTotal)}
            </button>
          </div>
          <MiniBarList
            rows={campaign.enrolledKcp2025.map((item) => ({
              name: item.name,
              value: item.quantity,
              caption: 'зачислено на КЦП',
            }))}
            total={enrolledKcpTotal}
            onOpen={(row) => openRows(row.name, row.value || 0, [], 'Детализация по направлениям ниже в таблице.')}
          />
        </section>
      </div>

      <section className="panel report-plan-panel">
        <div className="panel__header">
          <div>
            <h2>План набора 2026</h2>
            <p>Общий план, КЦП, прирост и изменение бюджетных мест.</p>
          </div>
          <button
            className="report-panel-action"
            type="button"
            onClick={() =>
              openRows(
                'План набора 2026',
                planTotal,
                campaign.plan2026.map((item) => ({
                  name: item.name,
                  value: item.total,
                  caption: `КЦП ${formatNumber(item.kcp)} · рост ${item.growthPercent}% · КЦП +${formatNumber(item.kcpDelta)}`,
                })),
              )
            }
          >
            {formatNumber(planTotal)}
          </button>
        </div>
        <div className="report-plan-cards">
          {campaign.plan2026.map((item) => {
            const share = getPercent(item.total, planTotal)
            const kcpShare = getPercent(item.kcp, item.total)

            return (
              <ClickableBlock
                className="report-plan-card"
                key={item.name}
                ariaLabel={`Показать состав плана ${item.name}`}
                onClick={() =>
                  openRows(item.name, item.total, [
                    { name: 'Всего мест', value: item.total },
                    { name: 'КЦП', value: item.kcp, caption: `${kcpShare}% от плана уровня` },
                    { name: 'Рост к предыдущему периоду', value: `${item.growthPercent}%` },
                    { name: 'Прирост КЦП', value: item.kcpDelta },
                  ])
                }
              >
                <span>{item.name}</span>
                <strong>{formatNumber(item.total)}</strong>
                <div className="report-plan-card__track">
                  <span style={{ width: `${share}%` }} />
                </div>
                <small>{formatNumber(item.kcp)} · рост {item.growthPercent}%</small>
              </ClickableBlock>
            )
          })}
        </div>
        <div className="report-plan-summary">
          <span>КЦП по плану</span>
          <strong>{formatNumber(planKcpTotal)}</strong>
        </div>
      </section>

      <div className="report-tables-grid">
        <AdmissionTable
          title="Приём 2025 по УГСН"
          subtitle="Все строки, доступные из текущей структуры отчёта."
          rows={campaign.admission2025Top}
          onOpen={(row) =>
            openRows(row.name, row.total, [
              { name: 'Уровень', value: row.level },
              { name: 'Всего принято', value: row.total },
              { name: 'КЦП', value: row.kcp, caption: `${getPercent(row.kcp, row.total)}% от строки` },
              { name: 'Вне КЦП', value: row.total - row.kcp },
            ])
          }
        />
        <AdmissionTable
          title="План 2026 по УГСН"
          subtitle="Направления с крупнейшими плановыми значениями."
          rows={campaign.plan2026Top}
          onOpen={(row) =>
            openRows(row.name, row.total, [
              { name: 'Уровень', value: row.level },
              { name: 'План всего', value: row.total },
              { name: 'КЦП', value: row.kcp, caption: `${getPercent(row.kcp, row.total)}% от строки` },
              { name: 'Вне КЦП', value: row.total - row.kcp },
            ])
          }
        />
      </div>
    </section>
  )
}

function GraduationContextSection({
  context,
  openDetail,
}: {
  context: ReportContextItem[]
  openDetail: (detail: DetailPayload) => void
}) {
  return (
    <section className="report-section report-section--compact">
      <div className="report-section__heading">
        <Layers3 size={30} aria-hidden="true" />
        <div>
          <h2>Ориентиры по выпуску</h2>
        </div>
      </div>

      <div className="report-context-grid">
        {context.map((item) => (
          <ClickableBlock
            className="report-context-card"
            key={item.name}
            ariaLabel={`Показать состав показателя ${item.name}`}
            onClick={() =>
              openDetail({
                title: item.name,
                total: item.value,
                rows: [],
                emptyText: item.note || 'Детализация этого ориентира будет добавлена позже.',
              })
            }
          >
            <span>{item.name}</span>
            <strong>{formatNumber(item.value)}</strong>
            {shouldShowContextNote(item.note) && <p>{item.note}</p>}
          </ClickableBlock>
        ))}
      </div>
    </section>
  )
}

function GraduationTable({
  level,
  onOpen,
}: {
  level: GraduationLevel
  onOpen: (detail: DetailPayload) => void
}) {
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
          onClick={() =>
            onOpen({
              title: level.name,
              total: level.total,
              rows: [
                { name: 'Летний выпуск', value: level.summer },
                { name: 'Зимний выпуск', value: level.winter },
              ],
            })
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
            {level.rows.map((item) => (
              <tr
                className="report-table__clickable-row"
                key={`${level.name}-${item.name}`}
                role="button"
                tabIndex={0}
                aria-label={`Показать состав выпуска ${item.name}`}
                onClick={() =>
                  onOpen({
                    title: item.name,
                    total: item.total,
                    rows: [
                      { name: 'Летний выпуск', value: item.summer },
                      { name: 'Зимний выпуск', value: item.winter },
                    ],
                  })
                }
                onKeyDown={keyOpen(() =>
                  onOpen({
                    title: item.name,
                    total: item.total,
                    rows: [
                      { name: 'Летний выпуск', value: item.summer },
                      { name: 'Зимний выпуск', value: item.winter },
                    ],
                  }),
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
  admissionPlan,
  openDetail,
}: {
  graduation: Report20252026['graduation']
  admissionPlan: ReportPlanRow[]
  openDetail: (detail: DetailPayload) => void
}) {
  const summerPercent = getPercent(graduation.summer.quantity, graduation.total)
  const winterPercent = 100 - summerPercent
  const summerLevelRows = graduation.levels.map((level) => ({
    name: level.name,
    value: level.summer,
    caption: `${getPercent(level.summer, graduation.summer.quantity)}% летнего выпуска`,
    meta: `${getPercent(level.summer, graduation.total)}% от общего выпуска. Бюджет/платно по летнему выпуску: нет данных в источнике.`,
  }))
  const winterLevelRows = graduation.levels.map((level) => ({
    name: level.name,
    value: level.winter,
    caption: `${getPercent(level.winter, graduation.winter.quantity)}% зимнего выпуска`,
    meta: `${getPercent(level.winter, graduation.total)}% от общего выпуска. Бюджет/платно по зимнему выпуску: нет данных в источнике.`,
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

      <div className="report-graduation-guide" aria-label="Пояснение к летнему и зимнему выпуску">
        <div className="report-graduation-guide__item report-graduation-guide__item--summer">
          <span>Летний выпуск</span>
          <strong>очная форма</strong>
          <small>{formatNumber(graduation.summer.quantity)} · {summerPercent}% от выпуска</small>
        </div>
        <div className="report-graduation-guide__item report-graduation-guide__item--winter">
          <span>Зимний выпуск</span>
          <strong>очно-заочная и заочная формы</strong>
          <small>{formatNumber(graduation.winter.quantity)} · {winterPercent}% от выпуска</small>
        </div>
      </div>

      <div className="report-graduation-chart">
        <ClickableBlock
          className="report-graduation-donut-panel"
          ariaLabel="Показать состав общего выпуска"
          onClick={() =>
            openDetail({
              title: `Выпуск ${graduation.year}`,
              total: graduation.total,
              rows: [
                {
                  name: graduation.summer.title,
                  value: graduation.summer.quantity,
                  caption: `${summerPercent}% от общего выпуска`,
                  meta: summerLevelRows
                    .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                    .join(' / '),
                  detail: {
                    title: graduation.summer.title,
                    total: graduation.summer.quantity,
                    subtitle: graduation.summer.description,
                    rows: [
                      ...summerLevelRows,
                      {
                        name: 'Платно / бесплатно',
                        caption: 'Нет прямой разбивки летнего выпуска на бюджет и платное обучение.',
                        value: 'нет данных',
                      },
                    ],
                  },
                },
                {
                  name: graduation.winter.title,
                  value: graduation.winter.quantity,
                  caption: `${winterPercent}% от общего выпуска`,
                  meta: winterLevelRows
                    .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                    .join(' / '),
                  detail: {
                    title: graduation.winter.title,
                    total: graduation.winter.quantity,
                    subtitle: graduation.winter.description,
                    rows: [
                      ...winterLevelRows,
                      {
                        name: 'Платно / бесплатно',
                        caption: 'Нет прямой разбивки зимнего выпуска на бюджет и платное обучение.',
                        value: 'нет данных',
                      },
                    ],
                  },
                },
                {
                  name: 'Платно / бесплатно',
                  caption: 'Разделение выпуска по платной и бюджетной основе в источнике не указано.',
                  value: 'нет данных',
                },
              ],
            })
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
            <button
              className="report-graduation-legend__item report-graduation-legend__item--summer"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                openDetail({
                  title: graduation.summer.title,
                  total: graduation.summer.quantity,
                  subtitle: graduation.summer.description,
                  rows: [
                    ...summerLevelRows,
                    {
                      name: 'Платно / бесплатно',
                      caption: 'Нет прямой разбивки летнего выпуска на бюджет и платное обучение.',
                      value: 'нет данных',
                    },
                  ],
                })
              }}
            >
              <span>{graduation.summer.title}</span>
              <strong>{formatNumber(graduation.summer.quantity)}</strong>
              <small>{summerPercent}%</small>
            </button>
            <button
              className="report-graduation-legend__item report-graduation-legend__item--winter"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                openDetail({
                  title: graduation.winter.title,
                  total: graduation.winter.quantity,
                  subtitle: graduation.winter.description,
                  rows: [
                    ...winterLevelRows,
                    {
                      name: 'Платно / бесплатно',
                      caption: 'Нет прямой разбивки зимнего выпуска на бюджет и платное обучение.',
                      value: 'нет данных',
                    },
                  ],
                })
              }}
            >
              <span>{graduation.winter.title}</span>
              <strong>{formatNumber(graduation.winter.quantity)}</strong>
              <small>{winterPercent}%</small>
            </button>
          </div>
        </ClickableBlock>

        <article className="report-graduation-levels">
          <header>
            <span>Структура выпуска</span>
            <strong>Бакалавры и магистры</strong>
            <p>Полоса показывает выпуск по периодам. Бюджет и платное обучение ниже — отдельный ориентир из плана приёма.</p>
          </header>
          <div className="report-graduation-levels__list">
            {graduation.levels.map((level) => {
              const levelSummerPercent = getPercent(level.summer, level.total)
              const levelWinterPercent = 100 - levelSummerPercent
              const relatedAdmissionPlan = getAdmissionPlanForGraduationLevel(level.name, admissionPlan)
              const paidPlaces = relatedAdmissionPlan ? Math.max(0, relatedAdmissionPlan.total - relatedAdmissionPlan.kcp) : 0

              return (
                <ClickableBlock
                  as="div"
                  className="report-graduation-level"
                  key={level.name}
                  ariaLabel={`Показать состав выпуска ${level.name}`}
                  onClick={() =>
                    openDetail({
                      title: level.name,
                      total: level.total,
                      rows: [
                        {
                          name: 'Летний выпуск',
                          value: level.summer,
                          caption: `${levelSummerPercent}% выпуска уровня`,
                          meta: `${getPercent(level.summer, graduation.summer.quantity)}% летнего выпуска. Бюджет/платно по сезону: нет данных в источнике.`,
                        },
                        {
                          name: 'Зимний выпуск',
                          value: level.winter,
                          caption: `${levelWinterPercent}% выпуска уровня`,
                          meta: `${getPercent(level.winter, graduation.winter.quantity)}% зимнего выпуска. Бюджет/платно по сезону: нет данных в источнике.`,
                        },
                        {
                          name: 'Бюджет по плану приёма 2026',
                          value: relatedAdmissionPlan ? relatedAdmissionPlan.kcp : 'нет данных',
                          caption: 'Ориентир из плана приёма, не разбивка выпуска.',
                        },
                        {
                          name: 'Платно по плану приёма 2026',
                          value: relatedAdmissionPlan ? paidPlaces : 'нет данных',
                          caption: 'Ориентир из плана приёма, не разбивка выпуска.',
                        },
                        ...level.rows.map((row) => ({ name: row.name, value: row.total })),
                      ],
                    })
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
                    <span className="report-graduation-level__season report-graduation-level__season--summer">
                      <small>Лето</small>
                      <strong>{formatNumber(level.summer)}</strong>
                      <em>{levelSummerPercent}% уровня</em>
                    </span>
                    <span className="report-graduation-level__season report-graduation-level__season--winter">
                      <small>Зима</small>
                      <strong>{formatNumber(level.winter)}</strong>
                      <em>{levelWinterPercent}% уровня</em>
                    </span>
                  </div>
                  <div className="report-graduation-level__plan-row" aria-label="План приёма 2026">
                    <span>План приёма 2026</span>
                    <strong>бюджет {relatedAdmissionPlan ? formatNumber(relatedAdmissionPlan.kcp) : 'нет данных'}</strong>
                    <strong>платно {relatedAdmissionPlan ? formatNumber(paidPlaces) : 'нет данных'}</strong>
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

  useEffect(() => {
    if (!activeDetail) return undefined

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setActiveDetail(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDetail])

  const reportMetrics = useMemo(() => {
    if (!report) return []

    const campaign = report.admissionCampaign
    const enrolledKcpTotal = campaign.enrolledKcp2025.reduce((sum, item) => sum + item.quantity, 0)
    const enrolledTotal = campaign.enrolledTotal2025 ?? enrolledKcpTotal
    const planTotal = campaign.plan2026.reduce((sum, item) => sum + item.total, 0)
    const graduation = report.graduation
    const graduationSummerPercent = getPercent(graduation.summer.quantity, graduation.total)
    const graduationWinterPercent = 100 - graduationSummerPercent
    const graduationSummerRows = graduation.levels.map((level) => ({
      name: level.name,
      value: level.summer,
      caption: `${getPercent(level.summer, graduation.summer.quantity)}% летнего выпуска`,
      meta: `${getPercent(level.summer, graduation.total)}% от общего выпуска. Бюджет/платно по летнему выпуску: нет данных в источнике.`,
    }))
    const graduationWinterRows = graduation.levels.map((level) => ({
      name: level.name,
      value: level.winter,
      caption: `${getPercent(level.winter, graduation.winter.quantity)}% зимнего выпуска`,
      meta: `${getPercent(level.winter, graduation.total)}% от общего выпуска. Бюджет/платно по зимнему выпуску: нет данных в источнике.`,
    }))

    return [
      {
        label: 'Программ приёма',
        value: campaign.programsTotal,
        caption: 'образовательных программ',
        tone: 'blue',
        icon: BookOpen,
        detail: {
          title: 'Программы приёма',
          total: campaign.programsTotal,
          rows: campaign.programBreakdown.map((item) => ({
            name: item.name,
            value: item.quantity,
            caption: 'образовательных программ',
          })),
        },
      },
      {
        label: 'Зачислено ВО',
        value: enrolledTotal,
        caption: 'КЦП, платное и прочие категории',
        tone: 'green',
        icon: Users,
        detail: {
          title: 'Зачислено ВО',
          total: enrolledTotal,
          rows: [
            ...campaign.enrolledKcp2025.map((item) => ({
              name: item.name,
              value: item.quantity,
              caption: 'КЦП',
            })),
            {
              name: 'Прочее зачисление',
              value: enrolledTotal - enrolledKcpTotal,
              caption: 'без детальной разбивки в текущей структуре данных',
            },
          ],
        },
      },
      {
        label: 'План набора 2026',
        value: planTotal,
        caption: 'Бакалавриат, специалитет, магистратура',
        tone: 'purple',
        icon: ClipboardList,
        detail: {
          title: 'План набора 2026',
          total: planTotal,
          rows: campaign.plan2026.map((item) => ({
            name: item.name,
            value: item.total,
            caption: `КЦП ${formatNumber(item.kcp)} · рост ${item.growthPercent}%`,
          })),
        },
      },
      {
        label: 'Выпуск 2026',
        value: graduation.total,
        caption: 'Летний и зимний выпуск',
        tone: 'cyan',
        icon: GraduationCap,
        detail: {
          title: 'Выпуск 2026',
          total: graduation.total,
          rows: [
            {
              name: graduation.summer.title,
              value: graduation.summer.quantity,
              caption: `${graduationSummerPercent}% от общего выпуска`,
              meta: graduationSummerRows
                .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                .join(' / '),
              detail: {
                title: graduation.summer.title,
                total: graduation.summer.quantity,
                subtitle: graduation.summer.description,
                rows: [
                  ...graduationSummerRows,
                  {
                    name: 'Платно / бесплатно',
                    caption: 'Нет прямой разбивки летнего выпуска на бюджет и платное обучение.',
                    value: 'нет данных',
                  },
                ],
              },
            },
            {
              name: graduation.winter.title,
              value: graduation.winter.quantity,
              caption: `${graduationWinterPercent}% от общего выпуска`,
              meta: graduationWinterRows
                .map((row) => `${row.name.toLowerCase()} ${formatValue(row.value)} (${row.caption.split('%')[0]}%)`)
                .join(' / '),
              detail: {
                title: graduation.winter.title,
                total: graduation.winter.quantity,
                subtitle: graduation.winter.description,
                rows: [
                  ...graduationWinterRows,
                  {
                    name: 'Платно / бесплатно',
                    caption: 'Нет прямой разбивки зимнего выпуска на бюджет и платное обучение.',
                    value: 'нет данных',
                  },
                ],
              },
            },
          ],
        },
      },
    ]
  }, [report])

  if (loading && !report) return <ReportLoading />

  if (!report) return null

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
            onClick={() => setActiveDetail(item.detail)}
          />
        ))}
      </section>

      <GraduationSection
        graduation={report.graduation}
        admissionPlan={report.admissionCampaign.plan2026}
        openDetail={setActiveDetail}
      />
      <GraduationContextSection context={report.admissionCampaign.context} openDetail={setActiveDetail} />

      <AdmissionSection report={report} openDetail={setActiveDetail} />

      <section className="report-section report-section--compact">
        <div className="report-section__heading">
          <Layers3 size={30} aria-hidden="true" />
          <div>
            <h2>Незаполненные раскрытия</h2>
            <p>Для показателей без детальной структуры попап уже предусмотрен и будет заполнен после уточнения данных.</p>
          </div>
        </div>
        <div className="report-placeholder-grid">
          {['Перечень конкретных программ', 'Детализация платного зачисления', 'Разрез по институтам'].map((name) => (
            <ClickableBlock
              className="report-placeholder-card"
              key={name}
              ariaLabel={`Открыть пустую детализацию ${name}`}
              onClick={() => setActiveDetail({ title: name, rows: [] })}
            >
              <Target size={22} aria-hidden="true" />
              <span>{name}</span>
            </ClickableBlock>
          ))}
        </div>
      </section>

      {activeDetail && (
        <ReportDetailPanel
          detail={activeDetail}
          onClose={() => setActiveDetail(null)}
          onOpenDetail={setActiveDetail}
        />
      )}
    </section>
  )
}
