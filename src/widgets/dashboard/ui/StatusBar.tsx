import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

type StatusBarProps = {
  loading: boolean
  error?: unknown
  lastUpdated?: string | null
  source?: string
}

export default function StatusBar({ loading, error, lastUpdated, source }: StatusBarProps) {
  const isDemo = source === 'mock'
  const isFile = source === 'file'
  const isExcel = source === 'xlsx'

  return (
    <div className={`status-bar ${error ? 'status-bar--error' : ''}`}>
      <div className="status-bar__item">
        {error ? <WifiOff size={20} /> : <Wifi size={20} />}
        <span>
          {error
            ? 'РќРµС‚ СЃРІСЏР·Рё СЃ backend'
            : isDemo
              ? 'Р”РµРјРѕ-РґР°РЅРЅС‹Рµ'
              : isFile
                ? 'РђСЂС…РёРІРЅС‹Рµ РґР°РЅРЅС‹Рµ 2025'
                : isExcel
                  ? 'Р”Р°РЅРЅС‹Рµ РёР· Excel'
                  : 'Р›РѕРєР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ'}
        </span>
      </div>
      <div className="status-bar__item">
        <RefreshCw size={20} className={loading ? 'spin' : ''} />
        <span>{lastUpdated ? `РћР±РЅРѕРІР»РµРЅРѕ: ${lastUpdated}` : 'РћР¶РёРґР°РЅРёРµ РґР°РЅРЅС‹С…'}</span>
      </div>
    </div>
  )
}
