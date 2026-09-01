import {
  ClipboardList,
  GraduationCap,
  MapPinned,
  School,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  CAMPAIGN_RESULTS_2026,
  getCompletionPercent,
  sumValues,
  type RankedResult,
} from '../../../entities/campaign-results/index.js'
import { formatNumber, formatPercentDecimal } from '../../../shared/lib/formatters.js'

const results = CAMPAIGN_RESULTS_2026

function formatCompletion(enrolled: number, plan: number): string {
  const percent = getCompletionPercent(enrolled, plan)
  return Number.isInteger(percent) ? `${percent}%` : formatPercentDecimal(percent)
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
}

function ResultMetric({
  caption,
  icon: Icon,
  title,
  value,
}: {
  caption: ReactNode
  icon: typeof GraduationCap
  title: string
  value: number
}) {
  return (
    <div className="campaign-results__metric">
      <span className="campaign-results__metric-icon" aria-hidden="true">
        <Icon size={27} strokeWidth={2.2} />
      </span>
      <span className="campaign-results__metric-title">{title}</span>
      <strong>{formatNumber(value)}</strong>
      <span className="campaign-results__metric-caption">{caption}</span>
    </div>
  )
}

function RankedList({
  rows,
  title,
  valueSuffix = '',
}: {
  rows: readonly RankedResult[]
  title: string
  valueSuffix?: string
}) {
  return (
    <div className="campaign-results__panel campaign-results__panel--ranked">
      <h4>{title}</h4>
      <div className="campaign-results__ranked-list">
        {rows.map((row, index) => (
          <div className="campaign-results__ranked-row" key={row.id}>
            <span className="campaign-results__rank">{index + 1}</span>
            <span className="campaign-results__ranked-name">
              <span>{row.name}</span>
              {(row.code || row.caption) && (
                <small>
                  {[row.code && `Код: ${row.code}`, row.caption].filter(Boolean).join(' · ')}
                </small>
              )}
            </span>
            <strong>{formatDecimal(row.value)}{valueSuffix}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CampaignResults2026() {
  const priorityTotal = sumValues(results.applications.priorities)
  const missingPriorities = results.applications.total - priorityTotal
  const maxPriority = Math.max(...results.applications.priorities.map((item) => item.value))

  return (
    <article
      className="campaign-results"
      aria-labelledby="campaign-results-title"
      data-manual-edit-ignore="true"
    >
      <header className="campaign-results__header">
        <div>
          <span className="campaign-results__eyebrow">Официальный итог</span>
          <h2 id="campaign-results-title">Приёмная кампания 2026</h2>
          <p>
            Данные зафиксированы на{' '}
            <time dateTime={results.source.snapshotDate}>{results.source.snapshotLabel}</time>.
          </p>
        </div>
      </header>

      <div className="campaign-results__metrics">
        <ResultMetric
          title="Зачислено на ВО"
          value={results.higherEducation.enrolled}
          caption={<>КЦП {formatNumber(results.higherEducation.plan)} · <b>{formatCompletion(results.higherEducation.enrolled, results.higherEducation.plan)}</b></>}
          icon={GraduationCap}
        />
        <ResultMetric
          title="Зачислено на СПО"
          value={results.secondaryVocational.enrolled}
          caption={<>КЦП {formatNumber(results.secondaryVocational.plan)} · <b>{formatCompletion(results.secondaryVocational.enrolled, results.secondaryVocational.plan)}</b></>}
          icon={School}
        />
        <ResultMetric
          title="Подано заявлений"
          value={results.applications.total}
          caption="Итог по способам подачи"
          icon={ClipboardList}
        />
        <ResultMetric
          title="Регионов привлечения"
          value={results.geography.regionsTotal}
          caption="Зачисленные на высшее образование"
          icon={MapPinned}
        />
      </div>

      <div className="campaign-results__primary-grid">
        <div className="campaign-results__panel">
          <div className="campaign-results__panel-heading">
            <h3>Выполнение КЦП по ВО</h3>
            <span>{formatCompletion(results.higherEducation.enrolled, results.higherEducation.plan)}</span>
          </div>
          <div className="campaign-results__table-scroll">
            <table className="campaign-results__table">
              <thead>
                <tr>
                  <th scope="col">Уровень</th>
                  <th scope="col">КЦП</th>
                  <th scope="col">Зачислено</th>
                  <th scope="col">Выполнение</th>
                </tr>
              </thead>
              <tbody>
                {results.higherEducation.levels.map((level) => (
                  <tr key={level.id}>
                    <th scope="row">{level.name}</th>
                    <td>{formatNumber(level.plan)}</td>
                    <td>{formatNumber(level.enrolled)}</td>
                    <td>{formatCompletion(level.enrolled, level.plan)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Всего</th>
                  <td>{formatNumber(results.higherEducation.plan)}</td>
                  <td>{formatNumber(results.higherEducation.enrolled)}</td>
                  <td>{formatCompletion(results.higherEducation.enrolled, results.higherEducation.plan)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="campaign-results__panel">
          <div className="campaign-results__panel-heading">
            <h3>Способ подачи заявлений</h3>
            <span>{formatNumber(results.applications.total)} всего</span>
          </div>
          <div className="campaign-results__table-scroll">
            <table className="campaign-results__table">
              <thead>
                <tr>
                  <th scope="col">Способ</th>
                  <th scope="col">2025</th>
                  <th scope="col">2026</th>
                </tr>
              </thead>
              <tbody>
                {results.applications.methods.map((method) => (
                  <tr key={method.id}>
                    <th scope="row">{method.name}</th>
                    <td>{formatNumber(method.previous)}</td>
                    <td>{formatNumber(method.current)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="campaign-results__panel">
          <div className="campaign-results__panel-heading">
            <h3>Зачислено по квотам</h3>
            <span>динамика 2024–2026</span>
          </div>
          <div className="campaign-results__table-scroll">
            <table className="campaign-results__table">
              <thead>
                <tr>
                  <th scope="col">Год</th>
                  <th scope="col">Особая</th>
                  <th scope="col">Отдельная</th>
                  <th scope="col">Целевая</th>
                </tr>
              </thead>
              <tbody>
                {results.quotas.enrolledByYear.map((row) => (
                  <tr key={row.year}>
                    <th scope="row">{row.year}</th>
                    <td>{formatNumber(row.special)}</td>
                    <td>{formatNumber(row.separate)}</td>
                    <td>{formatNumber(row.target)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <details className="campaign-results__details">
        <summary>Открыть остальные показатели презентации</summary>
        <div className="campaign-results__details-content">
          <div className="campaign-results__detail-heading">
            <h3>Конкурс и востребованность</h3>
            <p>Рейтинги приведены по образовательным профилям, как в презентации.</p>
          </div>
          <div className="campaign-results__ranked-grid">
            <RankedList title="Больше всего заявлений" rows={results.demand.topApplications} />
            <RankedList title="Меньше всего заявлений" rows={results.demand.lowestApplications} />
            <RankedList title="Конкурс, человек на место" rows={results.demand.peoplePerPlace} />
            <RankedList title="Конкурс, заявлений на место" rows={results.demand.applicationsPerPlace} />
          </div>

          <div className="campaign-results__context-grid">
            <div className="campaign-results__panel">
              <div className="campaign-results__panel-heading">
                <h3>Филиалы и колледжи</h3>
                <span>СПО: {formatNumber(results.secondaryVocational.enrolled)} из {formatNumber(results.secondaryVocational.plan)}</span>
              </div>
              <div className="campaign-results__table-scroll">
                <table className="campaign-results__table campaign-results__table--wide">
                  <thead>
                    <tr>
                      <th scope="col">Подразделение</th>
                      <th scope="col">КЦП СПО</th>
                      <th scope="col">Зачислено СПО</th>
                      <th scope="col">Зачислено ВО</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.branches.map((branch) => (
                      <tr key={branch.id}>
                        <th scope="row">
                          {branch.name}
                          {branch.note && <small>{branch.note}</small>}
                        </th>
                        <td>{formatNumber(branch.planSpo)}</td>
                        <td>
                          {formatNumber(branch.enrolledSpo)}
                          {branch.contractSpo > 0 && <small> + {formatNumber(branch.contractSpo)} платно</small>}
                        </td>
                        <td>{branch.enrolledHigher ? formatNumber(branch.enrolledHigher) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="campaign-results__panel">
              <div className="campaign-results__panel-heading">
                <h3>Приоритеты заявлений</h3>
                <span>{formatNumber(priorityTotal)} с указанным приоритетом</span>
              </div>
              <div className="campaign-results__priorities" aria-label="Распределение заявлений по приоритету">
                {results.applications.priorities.map((priority) => (
                  <div className="campaign-results__priority" key={priority.id}>
                    <span>{priority.name}</span>
                    <span className="campaign-results__priority-track" aria-hidden="true">
                      <span style={{ width: `${priority.value / maxPriority * 100}%` }} />
                    </span>
                    <strong>{formatNumber(priority.value)}</strong>
                  </div>
                ))}
              </div>
              <p className="campaign-results__note">
                В презентации приоритет указан у {formatNumber(priorityTotal)} из {formatNumber(results.applications.total)} заявлений;
                без указанного приоритета — {formatNumber(missingPriorities)}.
              </p>
            </div>

            <div className="campaign-results__panel">
              <div className="campaign-results__panel-heading">
                <h3>География зачисленных на ВО</h3>
                <span>{formatNumber(results.geography.regionsTotal)} регионов</span>
              </div>
              <div className="campaign-results__region-list">
                {results.geography.selectedRegions.map((region) => (
                  <div key={region.id}>
                    <span>{region.name}</span>
                    <strong>{formatNumber(region.value)}</strong>
                  </div>
                ))}
              </div>
              <p className="campaign-results__note">В презентации отдельно подписаны перечисленные территории; общее число регионов — 47.</p>
            </div>

            <div className="campaign-results__panel">
              <div className="campaign-results__panel-heading">
                <h3>Средний возраст зачисленных</h3>
                <span>лет</span>
              </div>
              <div className="campaign-results__table-scroll">
                <table className="campaign-results__table campaign-results__table--wide">
                  <thead>
                    <tr>
                      <th scope="col">Уровень</th>
                      <th scope="col">Очная</th>
                      <th scope="col">Очно-заочная</th>
                      <th scope="col">Заочная</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.ages.byLevelAndForm.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.name}</th>
                        <td>{formatDecimal(row.fullTime)}</td>
                        <td>{row.mixed === null ? '—' : formatDecimal(row.mixed)}</td>
                        <td>{row.partTime === null ? '—' : formatDecimal(row.partTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="campaign-results__nested-details">
                <summary>Возраст по факультетам и филиалам</summary>
                <div className="campaign-results__age-list">
                  {[...results.ages.byFaculty, ...results.ages.byBranch].map((row) => (
                    <div key={row.id}>
                      <span>{row.name}</span>
                      <strong>{formatDecimal(row.value)}</strong>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      </details>
    </article>
  )
}
