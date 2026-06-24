import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatPercentDecimal } from '../../../shared/lib/formatters.js'
import { KCP_SORT_OPTIONS, buildKcpRulerTicks, sortKcpDirections } from '../lib/kcpProgress.js'

export default function KcpProgress({ data, loading }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortMode, setSortMode] = useState('fillAsc')
  const [searchValue, setSearchValue] = useState('')
  const listRef = useRef(null)
  const hasPlan = data?.hasPlan
  const fillPercent = hasPlan ? data.fillPercent : 0
  const markerPercent = Math.min(100, Math.max(8, fillPercent))
  const directions = data?.directions || []
  const hasDirections = directions.length > 0
  const rulerTicks = useMemo(() => buildKcpRulerTicks(data?.plan), [data?.plan])
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
  const deltaLabel = data?.overflow > 0
    ? `превышение на ${formatNumber(data.overflow)}`
    : `осталось ${formatNumber(data?.remaining || 0)}`

  useEffect(() => {
    if (isExpanded) {
      listRef.current?.scrollTo({ top: 0 })
    }
  }, [isExpanded, sortMode, searchQuery])

  return (
    <section className={`kcp-panel${isExpanded ? ' kcp-panel--expanded' : ''}`} aria-busy={loading}>
      <div className="kcp-panel__header">
        <div>
          <h2>КЦП</h2>
          <p>Контрольные цифры приёма</p>
        </div>
        <div className="kcp-panel__header-actions">
          <button
            className="kcp-panel__toggle"
            type="button"
            aria-expanded={isExpanded}
            disabled={!hasDirections}
            onClick={() => setIsExpanded((value) => !value)}
          >
            <ChevronDown size={18} aria-hidden="true" />
            Детализация
          </button>
          <strong>{hasPlan ? formatPercentDecimal(data.percent) : 'Нет данных'}</strong>
        </div>
      </div>

      <div className="kcp-panel__track" aria-label="Заполнение контрольных цифр приёма">
        <span className="kcp-panel__fill" style={{ width: `${fillPercent}%` }} />
        {hasPlan ? (
          <span className="kcp-panel__current-marker" style={{ left: `${markerPercent}%` }}>
            {formatNumber(data?.current || 0)}
          </span>
        ) : null}
      </div>
      {rulerTicks.length ? (
        <div className="kcp-panel__ruler" aria-label="Линейка контрольных цифр приёма с шагом 1000">
          {rulerTicks.map((tick) => (
            <span
              className="kcp-panel__ruler-mark"
              key={tick.value}
              style={{ left: `${tick.percent}%` }}
            >
              <i aria-hidden="true" />
              <b>{tick.label}</b>
            </span>
          ))}
        </div>
      ) : null}

      <div className="kcp-panel__meta">
        <span>
          <strong>{formatNumber(data?.current || 0)}</strong>
          подано
        </span>
        <span>
          <strong>{hasPlan ? formatNumber(data.plan) : '—'}</strong>
          КЦП
        </span>
        <span>
          <strong>{hasPlan ? deltaLabel : 'нет плана'}</strong>
          остаток
        </span>
      </div>

      {isExpanded && hasDirections ? (
        <div className="kcp-panel__details">
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
                      подано
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
        </div>
      ) : null}
    </section>
  )
}
