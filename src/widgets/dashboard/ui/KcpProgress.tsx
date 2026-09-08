import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatPercent, formatPercentDecimal } from '../../../shared/lib/formatters.js'
import {
  KCP_DEFAULT_SORT_MODE,
  KCP_OFFICIAL_LEVELS_2026,
  KCP_OFFICIAL_SUMMARY_2026,
  KCP_SORT_OPTIONS,
  sortKcpDirections,
} from '../lib/kcpProgress.js'
import type { KcpSortMode } from '../lib/kcpProgress.js'

type KcpProgressDirection = {
  code?: string
  name: string
  plan: number
  current: number
  percent: number
  fillPercent: number
  remaining: number
  overflow: number
}

type KcpProgressData = {
  hasPlan?: boolean
  fillPercent?: number
  percent?: number
  plan?: number
  current?: number
  remaining?: number
  overflow?: number
  snapshotAt?: string | null
  directions?: KcpProgressDirection[]
}

type KcpProgressProps = {
  campaignYear: number
  data?: KcpProgressData | null
  loading: boolean
}

export default function KcpProgress({ campaignYear, data, loading }: KcpProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortMode, setSortMode] = useState<KcpSortMode>(KCP_DEFAULT_SORT_MODE)
  const [searchValue, setSearchValue] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const hasPlan = data?.hasPlan
  const showOfficialResult = campaignYear === 2026
  const officialPlan = KCP_OFFICIAL_SUMMARY_2026.plan
  const officialEnrolled = KCP_OFFICIAL_SUMMARY_2026.enrolled
  const officialPercent = KCP_OFFICIAL_SUMMARY_2026.percent
  const fillPercent = showOfficialResult ? Math.min(100, officialPercent) : hasPlan ? (data?.fillPercent ?? 0) : 0
  const directions = useMemo(() => data?.directions || [], [data?.directions])
  const hasDirections = showOfficialResult || directions.length > 0
  const searchQuery = searchValue.trim().toLowerCase()
  const filteredDirections = useMemo(() => {
    if (!searchQuery) return directions

    return directions.filter((item) => {
      const code = String(item.code || '').toLowerCase()
      const name = String(item.name || '').toLowerCase()

      return code.includes(searchQuery) || name.includes(searchQuery)
    })
  }, [directions, searchQuery])
  const sortedDirections = useMemo(() => sortKcpDirections(filteredDirections, sortMode), [filteredDirections, sortMode])
  const overflow = data?.overflow ?? 0
  const deltaLabel = overflow > 0
    ? `превышение на ${formatNumber(overflow)}`
    : `осталось ${formatNumber(data?.remaining || 0)}`

  useEffect(() => {
    if (isExpanded) {
      listRef.current?.scrollTo({ top: 0 })
    }
  }, [isExpanded, sortMode, searchQuery])

  const toggleDetails = () => {
    if (hasDirections) setIsExpanded((value) => !value)
  }

  const handleSummaryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasDirections || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    toggleDetails()
  }

  const operationalPercentage = hasPlan
    ? formatPercentDecimal(data?.percent)
    : loading ? 'Загрузка…' : 'Нет данных'
  const percentage = showOfficialResult ? formatPercent(officialPercent) : operationalPercentage

  return (
    <section
      className={`kcp-panel${isExpanded ? ' kcp-panel--expanded' : ''}`}
      aria-busy={!showOfficialResult && loading}
      data-manual-edit-ignore="true"
    >
      <div
        className={`kcp-panel__summary-trigger${hasDirections ? '' : ' kcp-panel__summary-trigger--disabled'}`}
        role="button"
        tabIndex={hasDirections ? 0 : undefined}
        aria-expanded={hasDirections ? isExpanded : undefined}
        aria-controls="kcp-directions-details"
        onClick={toggleDetails}
        onKeyDown={handleSummaryKeyDown}
      >
        <div className="kcp-panel__header">
        <div>
          <h2>{showOfficialResult ? 'Выполнение КЦП по ВО' : 'Оперативный спрос по КЦП'}</h2>
          <p>
            {showOfficialResult
              ? `Итог зачисления: ${formatNumber(officialEnrolled)} из ${formatNumber(officialPlan)}`
              : 'Первый приоритет и согласие'}
          </p>
        </div>
        <div className="kcp-panel__header-actions">
          <strong>{percentage}</strong>
          {hasDirections ? <ChevronDown className="kcp-panel__summary-icon" size={25} aria-hidden="true" /> : null}
        </div>
      </div>

      <div className="kcp-panel__track" aria-label={showOfficialResult ? 'Итоговое выполнение контрольных цифр приёма' : 'Оперативный спрос по контрольным цифрам приёма'}>
        <span className="kcp-panel__fill" style={{ width: `${fillPercent}%` }} />
      </div>
      </div>

      {(showOfficialResult || isExpanded) && hasDirections ? (
        <div
          className="kcp-panel__details"
          id="kcp-directions-details"
          hidden={!isExpanded}
          style={isExpanded ? undefined : { display: 'none' }}
        >
          <div className="kcp-panel__meta">
            <span>
              <strong>{formatNumber(showOfficialResult ? officialEnrolled : data?.current || 0)}</strong>
              {showOfficialResult ? 'Зачислено на ВО' : 'Ч. с 1-м приоритетом и согласием (бакалавриат и специалитет)'}
            </span>
            <span>
              <strong>{showOfficialResult ? formatNumber(officialPlan) : hasPlan ? formatNumber(data.plan) : '—'}</strong>
              КЦП
            </span>
            <span>
              <strong>{showOfficialResult ? formatPercent(officialPercent) : hasPlan ? deltaLabel : 'нет плана'}</strong>
              {showOfficialResult ? 'выполнение' : 'остаток'}
            </span>
          </div>
          {showOfficialResult ? (
            <div className="kcp-panel__direction-list" aria-label="Выполнение КЦП по уровням высшего образования">
              {KCP_OFFICIAL_LEVELS_2026.map((level) => (
                <article className="kcp-panel__direction" key={level.id}>
                  <div className="kcp-panel__direction-main">
                    <span>{level.name}</span>
                    <small>Уровень образования</small>
                  </div>
                  <div className="kcp-panel__direction-progress">
                    <div className="kcp-panel__direction-track">
                      <span style={{ width: `${Math.min(100, level.percent)}%` }} />
                    </div>
                    <strong>{formatPercent(level.percent)}</strong>
                  </div>
                  <div className="kcp-panel__direction-numbers" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <span>
                      <strong>{formatNumber(level.enrolled)}</strong>
                      Зачислено
                    </span>
                    <span>
                      <strong>{formatNumber(level.plan)}</strong>
                      КЦП
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="kcp-panel__details-toolbar">
                <span>{formatNumber(sortedDirections.length)} из {formatNumber(directions.length)} направлений</span>
                <label className="kcp-panel__search">
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Поиск по коду или названию"
                    aria-label="Поиск направления по коду или названию"
                  />
                </label>
                <div className="kcp-panel__sort" role="group" aria-label="Сортировка направлений КЦП">
                  {KCP_SORT_OPTIONS.map((option) => (
                    <button
                      className={`kcp-panel__sort-button${sortMode === option.value ? ' kcp-panel__sort-button--active' : ''}`}
                      key={option.value}
                      type="button"
                      onClick={() => setSortMode(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="kcp-panel__description">
                Сводный показатель рассчитан для бакалавриата и специалитета по первому приоритету и поданному согласию. Детализация ниже включает все уровни из оперативного API.
              </p>

              <div className="kcp-panel__direction-list" ref={listRef}>
                {sortedDirections.length ? sortedDirections.map((item) => {
                  const itemDeltaLabel = item.overflow > 0
                    ? `+${formatNumber(item.overflow)}`
                    : formatNumber(item.remaining)

                  return (
                    <article className="kcp-panel__direction" key={`${item.code || ''}::${item.name}`}>
                      <div className="kcp-panel__direction-main">
                        <span>{item.name}</span>
                        <small>{item.code ? `Код: ${item.code}` : 'Направление'}</small>
                      </div>
                      <div className="kcp-panel__direction-progress">
                        <div className="kcp-panel__direction-track">
                          <span style={{ width: `${item.fillPercent}%` }} />
                        </div>
                        <strong>{formatPercentDecimal(item.percent)}</strong>
                      </div>
                      <div className="kcp-panel__direction-numbers">
                        <span>
                          <strong>{formatNumber(item.current)}</strong>
                          Ч. с 1-м приоритетом и согласием
                        </span>
                        <span>
                          <strong>{formatNumber(item.plan)}</strong>
                          КЦП
                        </span>
                        <span>
                          <strong>{itemDeltaLabel}</strong>
                          {item.overflow > 0 ? 'сверх' : 'осталось'}
                        </span>
                      </div>
                    </article>
                  )
                }) : (
                  <div className="kcp-panel__empty">
                    Направления не найдены
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
