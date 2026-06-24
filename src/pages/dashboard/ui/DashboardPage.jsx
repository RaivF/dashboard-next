import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApplicantsStatistics } from '../../../entities/applicants/model/useApplicantsStatistics.js'
import { buildAnalytics } from '../../../entities/applicants/lib/analytics.js'
import { useDashboardSettings } from '../../../features/dashboard-settings/model/useDashboardSettings.js'
import { getRangeLabel } from '../../../features/dashboard-settings/model/periodConfig.js'
import PeriodControls from '../../../features/dashboard-settings/ui/PeriodControls.jsx'
import DashboardContent from '../../../widgets/dashboard/ui/DashboardContent.jsx'

export default function DashboardPage() {
  const {
    period,
    range,
    setRange,
    selectedDate,
    setSelectedDate,
    showPreviousYearOverlay,
    setShowPreviousYearOverlay,
    showPreviousYearFunding,
    setShowPreviousYearFunding,
    showPreviousYearForm,
    setShowPreviousYearForm,
    showPreviousYearMethod,
    setShowPreviousYearMethod,
    campaignYear,
    setCampaignYear,
  } = useDashboardSettings()
  const {
    response,
    loading,
    error,
    refresh,
  } = useApplicantsStatistics(period)
  const analytics = useMemo(() => buildAnalytics(response, range, selectedDate), [response, range, selectedDate])
  const selectedRange = getRangeLabel(range)

  return (
    <>
      <section className="dashboard-actions" aria-label="Действия дашборда">
        <button className="refresh-button" type="button" onClick={refresh} disabled={loading}>
          <RefreshCw size={24} className={loading ? 'spin' : ''} />
          {loading ? 'Загрузка' : 'Обновить'}
        </button>
      </section>

      <PeriodControls
        analytics={analytics}
        campaignYear={campaignYear}
        loading={loading}
        range={range}
        selectedDate={selectedDate}
        selectedRange={selectedRange}
        setCampaignYear={setCampaignYear}
        setRange={setRange}
        setSelectedDate={setSelectedDate}
      />

      {error && (
        <section className="error-box">
          <strong>Ошибка загрузки данных</strong>
          <span>{error.status ? `HTTP ${error.status}: ` : ''}{error.message}</span>
        </section>
      )}

      <DashboardContent
        analytics={analytics}
        campaignYear={campaignYear}
        loading={loading}
        selectedRange={selectedRange}
        showPreviousYearOverlay={showPreviousYearOverlay}
        setShowPreviousYearOverlay={setShowPreviousYearOverlay}
        showPreviousYearFunding={showPreviousYearFunding}
        setShowPreviousYearFunding={setShowPreviousYearFunding}
        showPreviousYearForm={showPreviousYearForm}
        setShowPreviousYearForm={setShowPreviousYearForm}
        showPreviousYearMethod={showPreviousYearMethod}
        setShowPreviousYearMethod={setShowPreviousYearMethod}
      />
    </>
  )
}
