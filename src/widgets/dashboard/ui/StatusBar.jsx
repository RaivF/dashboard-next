import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function StatusBar({ loading, error, lastUpdated, source }) {
  const isDemo = source === 'mock'
  const isFile = source === 'file'
  const isExcel = source === 'xlsx'

  return (
    <div className={`status-bar ${error ? 'status-bar--error' : ''}`}>
      <div className="status-bar__item">
        {error ? <WifiOff size={20} /> : <Wifi size={20} />}
        <span>{error ? 'Нет связи с backend' : isDemo ? 'Демо-данные' : isFile ? 'Архивные данные 2025' : isExcel ? 'Данные из Excel' : 'Локальные данные'}</span>
      </div>
      <div className="status-bar__item">
        <RefreshCw size={20} className={loading ? 'spin' : ''} />
        <span>{lastUpdated ? `Обновлено: ${lastUpdated}` : 'Ожидание данных'}</span>
      </div>
    </div>
  )
}
