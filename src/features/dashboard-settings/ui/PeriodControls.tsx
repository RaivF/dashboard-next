import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import {
  CALENDAR_HINTS,
  CALENDAR_LABELS,
  MAX_CAMPAIGN_YEAR,
  MIN_CAMPAIGN_YEAR,
} from '../model/periodConfig.js'

type PeriodAnalytics = {
  rangeEnd: Date | null
  rangeStart: Date | null
  rangeText: string
  latestDate: string
}

type PeriodControlsProps = {
  analytics: PeriodAnalytics
  campaignYear: number
  loading: boolean
  selectedRange: string
  setCampaignYear: (nextYear: number) => void
}

export default function PeriodControls({
  analytics,
  campaignYear,
  loading,
  selectedRange,
  setCampaignYear,
}: PeriodControlsProps) {
  const periodMenuRef = useRef<HTMLDivElement | null>(null)
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)

  useEffect(() => {
    if (!periodMenuOpen) return undefined

    function handlePointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!periodMenuRef.current?.contains(target)) setPeriodMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPeriodMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [periodMenuOpen])

  const handleCampaignYearChange = (nextYear: number) => {
    if (loading) return
    setCampaignYear(nextYear)
  }

  return (
    <section className="range-panel" aria-label="Настройки периода отображения">
      <div className="range-panel__summary">
        <div>
          <span>Отображение данных</span>
          <strong>{selectedRange}</strong>
        </div>
        <div className="range-panel__dates">
          <span>Период выборки</span>
          <strong>{analytics.rangeText}</strong>
        </div>
      </div>

      <div className="period-menu" ref={periodMenuRef}>
        <button
          className={periodMenuOpen ? 'period-menu__button period-menu__button--open' : 'period-menu__button'}
          type="button"
          onClick={() => setPeriodMenuOpen((isOpen) => !isOpen)}
          aria-expanded={periodMenuOpen}
          aria-controls="period-settings-panel"
          disabled={loading}
        >
          <CalendarDays size={24} />
          <span>Отображение периода</span>
          <ChevronDown size={22} />
        </button>

        {periodMenuOpen && (
          <div className="period-menu__panel" id="period-settings-panel">
            <div className="period-menu__header">
              <div>
                <span>Настройки периода</span>
                <strong>{selectedRange}</strong>
              </div>
              <button className="period-menu__close" type="button" onClick={() => setPeriodMenuOpen(false)}>
                Закрыть
              </button>
            </div>

            <div className="campaign-year-control">
              <div className="campaign-year-control__text">
                <span>Год приёмной кампании</span>
                <strong>{campaignYear}</strong>
              </div>
              <div className="campaign-year-control__actions">
                <button
                  className="campaign-year-control__button"
                  type="button"
                  onClick={() => handleCampaignYearChange(campaignYear - 1)}
                  disabled={loading || campaignYear <= MIN_CAMPAIGN_YEAR}
                  aria-label="Предыдущий год приёмной кампании"
                >
                  -
                </button>
                <button
                  className="campaign-year-control__button"
                  type="button"
                  onClick={() => handleCampaignYearChange(campaignYear + 1)}
                  disabled={loading || campaignYear >= MAX_CAMPAIGN_YEAR}
                  aria-label="Следующий год приёмной кампании"
                >
                  +
                </button>
              </div>
            </div>

            <div className="period-menu__current">
              <span>Период выборки</span>
              <strong>{analytics.rangeText}</strong>
            </div>

            <div className="calendar-control calendar-control--static">
              <div className="calendar-control__topline">
                <span>{CALENDAR_LABELS.actual}</span>
              </div>
              <strong>{analytics.latestDate}</strong>
              <small>{CALENDAR_HINTS.actual}</small>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
