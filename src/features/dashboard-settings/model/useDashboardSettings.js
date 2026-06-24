import { getCampaignYear, useDashboardSettingsStore } from './dashboardSettingsStore.js'

export function useDashboardSettings() {
  const period = useDashboardSettingsStore((state) => state.period)
  const range = useDashboardSettingsStore((state) => state.range)
  const setRange = useDashboardSettingsStore((state) => state.setRange)
  const selectedDate = useDashboardSettingsStore((state) => state.selectedDate)
  const setSelectedDate = useDashboardSettingsStore((state) => state.setSelectedDate)
  const showPreviousYearOverlay = useDashboardSettingsStore((state) => state.showPreviousYearOverlay)
  const setShowPreviousYearOverlay = useDashboardSettingsStore(
    (state) => state.setShowPreviousYearOverlay,
  )
  const showPreviousYearFunding = useDashboardSettingsStore((state) => state.showPreviousYearFunding)
  const setShowPreviousYearFunding = useDashboardSettingsStore(
    (state) => state.setShowPreviousYearFunding,
  )
  const showPreviousYearForm = useDashboardSettingsStore((state) => state.showPreviousYearForm)
  const setShowPreviousYearForm = useDashboardSettingsStore((state) => state.setShowPreviousYearForm)
  const showPreviousYearMethod = useDashboardSettingsStore((state) => state.showPreviousYearMethod)
  const setShowPreviousYearMethod = useDashboardSettingsStore(
    (state) => state.setShowPreviousYearMethod,
  )
  const setCampaignYear = useDashboardSettingsStore((state) => state.setCampaignYear)
  const campaignYear = getCampaignYear(period)

  return {
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
  }
}
