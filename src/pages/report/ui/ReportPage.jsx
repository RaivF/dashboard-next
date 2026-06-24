import { useMemo } from 'react'
import { BookOpen, ClipboardList, GraduationCap, Users } from 'lucide-react'
import { useReport20252026 } from '../../../entities/report/model/useReport20252026.js'
import { formatNumber } from '../../../shared/lib/formatters.js'

function ReportMetric({ label, value, caption, tone = 'blue', icon: Icon }) {
  return (
    <article className={`report-metric report-metric--${tone}`}>
      {Icon && (
        <span className="report-metric__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <span>{label}</span>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      {caption && <p>{caption}</p>}
    </article>
  )
}

function getPercent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function GraduationTable({ level }) {
  return (
    <section className="panel report-table-panel">
      <div className="panel__header">
        <div>
          <h2>{level.name}</h2>
          <p>Летний и зимний выпуск по укрупнённым группам</p>
        </div>
        <div className="report-table-total">
          <span>Всего</span>
          <strong>{formatNumber(level.total)}</strong>
        </div>
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
              <tr key={`${level.name}-${item.name}`}>
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

function GraduationSection({ graduation }) {
  const summerPercent = getPercent(graduation.summer.quantity, graduation.total)
  const winterPercent = 100 - summerPercent

  return (
    <section className="report-section report-section--primary">
      <div className="report-section__heading">
        <GraduationCap size={30} aria-hidden="true" />
        <div>
          <h2>Выпуск 2026</h2>
          <p>Разделение на летний выпуск очной формы и зимний выпуск очно-заочной/заочной формы.</p>
        </div>
      </div>

      <div className="report-graduation-chart">
        <article className="report-graduation-donut-panel">
          <div
            className="report-graduation-donut"
            style={{ '--summer-share': `${summerPercent}%` }}
            aria-label={`Летний выпуск ${formatNumber(graduation.summer.quantity)}, зимний выпуск ${formatNumber(graduation.winter.quantity)}`}
          >
            <div>
              <span>Итого</span>
              <strong>{formatNumber(graduation.total)}</strong>
            </div>
          </div>
          <div className="report-graduation-legend">
            <div className="report-graduation-legend__item report-graduation-legend__item--summer">
              <span>{graduation.summer.title}</span>
              <strong>{formatNumber(graduation.summer.quantity)}</strong>
              <small>{summerPercent}%</small>
            </div>
            <div className="report-graduation-legend__item report-graduation-legend__item--winter">
              <span>{graduation.winter.title}</span>
              <strong>{formatNumber(graduation.winter.quantity)}</strong>
              <small>{winterPercent}%</small>
            </div>
          </div>
        </article>

        <article className="report-graduation-levels">
          <header>
            <span>Структура выпуска</span>
            <strong>Бакалавры и магистры</strong>
          </header>
          <div className="report-graduation-levels__list">
            {graduation.levels.map((level) => {
              const levelPercent = getPercent(level.total, graduation.total)
              const levelSummerPercent = getPercent(level.summer, level.total)
              const levelWinterPercent = 100 - levelSummerPercent

              return (
                <div className="report-graduation-level" key={level.name}>
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
                  <div className="report-graduation-level__meta">
                    <span>{levelPercent}% от выпуска</span>
                    <span>лето {formatNumber(level.summer)} / зима {formatNumber(level.winter)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </div>

      <div className="report-tables-grid">
        {graduation.levels.map((level) => (
          <GraduationTable key={level.name} level={level} />
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
  const { report, loading, error } = useReport20252026()

  const reportMetrics = useMemo(() => {
    if (!report) return []

    return [
      {
        label: 'Программ приёма',
        value: report.admissionCampaign.programsTotal,
        caption: 'образовательных программ',
        tone: 'blue',
        icon: BookOpen,
      },
      {
        label: 'Зачислено ВО',
        value:
          report.admissionCampaign.enrolledTotal2025 ??
          report.admissionCampaign.enrolledKcp2025.reduce((sum, item) => sum + item.quantity, 0),
        caption: 'С учётом платного, без СПО и аспирантуры',
        tone: 'green',
        icon: Users,
      },
      {
        label: 'План набора 2026',
        value: report.admissionCampaign.plan2026.reduce((sum, item) => sum + item.total, 0),
        caption: 'Бакалавриат, специалитет, магистратура',
        tone: 'purple',
        icon: ClipboardList,
      },
      {
        label: 'Выпуск 2026',
        value: report.graduation.total,
        caption: 'Летний и зимний выпуск',
        tone: 'cyan',
        icon: GraduationCap,
      },
    ]
  }, [report])

  if (loading && !report) return <ReportLoading />

  if (error) {
    return (
      <section className="report-page">
        <div className="error-box">
          <strong>Ошибка загрузки отчёта</strong>
          <span>{error}</span>
        </div>
      </section>
    )
  }

  if (!report) return null

  return (
    <section className="report-page">
      <section className="report-metrics" aria-label="Ключевые показатели отчёта">
        {reportMetrics.map((item) => (
          <ReportMetric key={item.label} {...item} />
        ))}
      </section>

      <GraduationSection graduation={report.graduation} />

    </section>
  )
}
