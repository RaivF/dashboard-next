import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApplicantsStatistics } from '../../../entities/applicants/model/useApplicantsStatistics.js'
import { useCompetitionGroupsDemand } from '../../../entities/competition-groups/index.js'
import { buildAnalytics } from '../../../entities/applicants/lib/analytics.js'
import { useDashboardSettings } from '../../../features/dashboard-settings/model/useDashboardSettings.js'
import { getRangeLabel } from '../../../features/dashboard-settings/model/periodConfig.js'
import PeriodControls from '../../../features/dashboard-settings/ui/PeriodControls.js'
import { applyCampaignResults2026 } from '../../../widgets/dashboard/lib/applyCampaignResults2026.js'
import CampaignResults2026 from '../../../widgets/dashboard/ui/CampaignResults2026.js'
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
    campaignYear,
    setCampaignYear,
  } = useDashboardSettings()
  const {
    response,
    loading,
    refresh,
  } = useApplicantsStatistics(period)
  const {
    data: competitionGroupsDemand,
    loading: competitionGroupsDemandLoading,
  } = useCompetitionGroupsDemand(campaignYear)
  const analytics = useMemo(() => buildAnalytics(response, range, selectedDate), [response, range, selectedDate])
  const synchronizedAnalytics = useMemo(
    () => applyCampaignResults2026(analytics, campaignYear),
    [analytics, campaignYear],
  )
  const selectedRange = getRangeLabel(range)

  return (
    <>
      <CampaignResults2026 />

      <details className="operational-dashboard">
        <summary>
          <span>{campaignYear === 2026 ? 'Сведения о заявлениях' : 'Оперативный срез заявлений'}</span>
          <small>
            Данные {synchronizedAnalytics.rangeText ? `за период ${synchronizedAnalytics.rangeText}` : 'загружаются'}
          </small>
        </summary>
        <div className="operational-dashboard__content">
          <section className="dashboard-actions" aria-label="Действия оперативного дашборда">
            <button className="refresh-button" type="button" onClick={refresh} disabled={loading}>
              <RefreshCw size={24} className={loading ? 'spin' : ''} />
              {loading ? 'Загрузка' : 'Обновить'}
            </button>
          </section>

          <PeriodControls
            analytics={synchronizedAnalytics}
            campaignYear={campaignYear}
            loading={loading}
            selectedRange={selectedRange}
            setCampaignYear={setCampaignYear}
          />

          <DashboardContent
            analytics={synchronizedAnalytics}
            campaignYear={campaignYear}
            competitionGroupsDemand={competitionGroupsDemand}
            competitionGroupsDemandLoading={competitionGroupsDemandLoading}
            loading={loading}
            selectedRange={selectedRange}
            showPreviousYearOverlay={showPreviousYearOverlay}
            setShowPreviousYearOverlay={setShowPreviousYearOverlay}
            showPreviousYearFunding={showPreviousYearFunding}
            setShowPreviousYearFunding={setShowPreviousYearFunding}
          />
        </div>
      </details>
    </>
  )
}
