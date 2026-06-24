export function MissingDateDot({ cx, cy, payload }) {
  return null
}

export function ActiveDateDot({ cx, cy, payload }) {
  if (cx === undefined || cy === undefined) return null

  if (payload?.isMissing) {
    return <circle cx={cx} cy={cy} r={8} fill="var(--chart-missing-fill)" stroke="var(--chart-active-stroke)" strokeWidth={3} />
  }

  return <circle cx={cx} cy={cy} r={7} fill="var(--blue)" stroke="var(--chart-active-stroke)" strokeWidth={3} />
}

export function PreviousYearMissingDot({ cx, cy, payload }) {
  return null
}

export function ActivePreviousYearDot({ cx, cy, payload }) {
  if (cx === undefined || cy === undefined) return null

  if (payload?.previousYearIsMissing) {
    return <circle cx={cx} cy={cy} r={7} fill="var(--chart-missing-fill)" stroke="var(--chart-previous-year)" strokeWidth={3} />
  }

  return <circle cx={cx} cy={cy} r={6} fill="var(--chart-previous-year)" stroke="var(--chart-active-stroke)" strokeWidth={3} />
}
