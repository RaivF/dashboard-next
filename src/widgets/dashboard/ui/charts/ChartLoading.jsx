export default function ChartLoading({ variant = 'bar' }) {
  const bars = [68, 38, 82, 54, 44, 72, 58]

  if (variant === 'donut') {
    return (
      <div className="chart-loading chart-loading--donut" aria-label="Загрузка диаграммы">
        <div className="chart-loading__ring" />
        <div className="chart-loading__legend">
          <span />
          <span />
          <span />
        </div>
      </div>
    )
  }

  if (variant === 'area') {
    return (
      <div className="chart-loading chart-loading--area" aria-label="Загрузка графика">
        <div className="chart-loading__grid" />
        <div className="chart-loading__line" />
        <div className="chart-loading__glow" />
      </div>
    )
  }

  return (
    <div className="chart-loading chart-loading--bar" aria-label="Загрузка графика">
      <div className="chart-loading__grid" />
      <div className="chart-loading__bars">
        {bars.map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  )
}
