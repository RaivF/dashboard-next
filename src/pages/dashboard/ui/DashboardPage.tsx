import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApplicantsStatistics } from '../../../entities/applicants/model/useApplicantsStatistics.js'
import { buildAnalytics } from '../../../entities/applicants/lib/analytics.js'
import { useDashboardSettings } from '../../../features/dashboard-settings/model/useDashboardSettings.js'
import { getRangeLabel } from '../../../features/dashboard-settings/model/periodConfig.js'
import PeriodControls from '../../../features/dashboard-settings/ui/PeriodControls.js'
import DashboardContent from '../../../widgets/dashboard/ui/DashboardContent.js'

type DashboardError = {
  status?: number
  message?: string
}

export default function DashboardPage() {
  const {
    period,
    range,
    selectedDate,
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
  const dashboardError = error as DashboardError | null

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
        selectedRange={selectedRange}
        setCampaignYear={setCampaignYear}
      />

      {dashboardError && (
        <section className="error-box">
          <strong>Ошибка загрузки данных</strong>
          <span>{dashboardError.status ? `HTTP ${dashboardError.status}: ` : ''}{dashboardError.message}</span>
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
