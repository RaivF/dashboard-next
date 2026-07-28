import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { useApplicantsStatistics } from '../../../entities/applicants/model/useApplicantsStatistics.js'
import { useCompetitionGroupsDemand } from '../../../entities/competition-groups/index.js'
import { buildAnalytics } from '../../../entities/applicants/lib/analytics.js'
import { buildUnusedSpecialties } from '../../../entities/applicants/lib/analytics/unusedSpecialties.js'
import { useSpecialties } from '../../../entities/specialties/model/useSpecialties.js'
import { useDashboardSettings } from '../../../features/dashboard-settings/model/useDashboardSettings.js'
import { getRangeLabel } from '../../../features/dashboard-settings/model/periodConfig.js'
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
    error: competitionGroupsDemandError,
  } = useCompetitionGroupsDemand(campaignYear)
  const {
    rows: specialties,
    loading: specialtiesLoading,
  } = useSpecialties()
  const analytics = useMemo(() => buildAnalytics(response, range, selectedDate), [response, range, selectedDate])
  const unusedSpecialties = useMemo(
    () => buildUnusedSpecialties(specialties, analytics.allItems),
    [analytics.allItems, specialties],
  )
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
        selectedRange={selectedRange}
        setCampaignYear={setCampaignYear}
      />

      <DashboardContent
        analytics={analytics}
        campaignYear={campaignYear}
        competitionGroupsDemand={competitionGroupsDemand}
        competitionGroupsDemandError={competitionGroupsDemandError}
        competitionGroupsDemandLoading={competitionGroupsDemandLoading}
        loading={loading}
        selectedRange={selectedRange}
        unusedSpecialties={unusedSpecialties}
        unusedSpecialtiesLoading={specialtiesLoading}
        showPreviousYearOverlay={showPreviousYearOverlay}
        setShowPreviousYearOverlay={setShowPreviousYearOverlay}
        showPreviousYearFunding={showPreviousYearFunding}
        setShowPreviousYearFunding={setShowPreviousYearFunding}
      />
    </>
  )
}
