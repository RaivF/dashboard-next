import type { LucideIcon } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { formatNumber } from '../lib/formatters.js'

type StatCardProps = {
  title: string
  value: number | string
  caption?: string
  icon?: LucideIcon
  tone?: string
  suffix?: string
  onClick?: () => void
  ariaLabel?: string
}

export default function StatCard({
  title,
  value,
  caption,
  icon: Icon,
  tone = 'blue',
  suffix = '',
  onClick,
  ariaLabel,
}: StatCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }

    event.preventDefault()
    onClick()
  }

  return (
    <article
      className={`stat-card stat-card--${tone}${onClick ? ' stat-card--interactive' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? ariaLabel || title : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="stat-card__icon">{Icon && <Icon size={34} strokeWidth={2.2} />}</div>
      <div className="stat-card__body">
        <p className="stat-card__title">{title}</p>
        <div className="stat-card__value">
          {typeof value === 'number' ? formatNumber(value) : value}
          {suffix && <span>{suffix}</span>}
        </div>
        {caption && <p className="stat-card__caption">{caption}</p>}
      </div>
    </article>
  )
}
