import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatPercentDecimal } from '../../../shared/lib/formatters.js'
import { KCP_SORT_OPTIONS, sortKcpDirections } from '../lib/kcpProgress.js'
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
  data?: KcpProgressData | null
  loading: boolean
}

export default function KcpProgress({ data, loading }: KcpProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sortMode, setSortMode] = useState<KcpSortMode>('fillAsc')
  const [searchValue, setSearchValue] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const hasPlan = data?.hasPlan
  const fillPercent = hasPlan ? (data?.fillPercent ?? 0) : 0
  const directions = useMemo(() => data?.directions || [], [data?.directions])
  const hasDirections = directions.length > 0
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

  const percentage = hasPlan ? formatPercentDecimal(data?.percent) : (loading ? 'Загрузка…' : 'Нет данных')

  return (
    <section className={`kcp-panel${isExpanded ? ' kcp-panel--expanded' : ''}`} aria-busy={loading}>
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
          <h2>КЦП</h2>
          <p>Люди с первым приоритетом и согласием</p>
        </div>
        <div className="kcp-panel__header-actions">
          <strong>{percentage}</strong>
          {hasDirections ? <ChevronDown className="kcp-panel__summary-icon" size={25} aria-hidden="true" /> : null}
        </div>
      </div>

      <div className="kcp-panel__track" aria-label="Заполнение контрольных цифр приёма">
        <span className="kcp-panel__fill" style={{ width: `${fillPercent}%` }} />
      </div>
      </div>

      {isExpanded && hasDirections ? (
        <div className="kcp-panel__details" id="kcp-directions-details">
          <div className="kcp-panel__meta">
            <span>
              <strong>{formatNumber(data?.current || 0)}</strong>
              Ч. с 1-м приоритетом и согласием
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
            Рассчитано на основе первого приоритета и поданного согласия.
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
          {data?.snapshotAt ? <p className="kcp-panel__snapshot">Данные актуальны на {new Date(data.snapshotAt).toLocaleString('ru-RU')}</p> : null}
        </div>
      ) : null}
    </section>
  )
}
