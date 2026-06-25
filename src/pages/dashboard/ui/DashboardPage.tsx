import { useEffect, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApplicantsStatistics } from '../../../entities/applicants/model/useApplicantsStatistics.js'
import { buildAnalytics } from '../../../entities/applicants/lib/analytics.js'
import { useDashboardSettings } from '../../../features/dashboard-settings/model/useDashboardSettings.js'
import { getRangeLabel } from '../../../features/dashboard-settings/model/periodConfig.js'
import { warmOfflineResources } from '../../../shared/offline/offlineResources.js'
import PeriodControls from '../../../features/dashboard-settings/ui/PeriodControls.js'
import DashboardContent from '../../../widgets/dashboard/ui/DashboardContent.js'

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
    refresh,
  } = useApplicantsStatistics(period)
  const analytics = useMemo(() => buildAnalytics(response, range, selectedDate), [response, range, selectedDate])
  const selectedRange = getRangeLabel(range)

  useEffect(() => {
    warmOfflineResources().catch((warmupError: unknown) => {
      console.warn('Offline resources warmup failed:', warmupError)
    })
  }, [])

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
