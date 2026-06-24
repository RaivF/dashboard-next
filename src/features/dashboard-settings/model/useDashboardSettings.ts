import { getCampaignYear, useDashboardSettingsStore } from './dashboardSettingsStore.js'
import type { RangeValue } from './periodConfig.js'

type UseDashboardSettingsResult = {
  period: string
  range: RangeValue
  setRange: (range: RangeValue) => void
  selectedDate: Date | null
  setSelectedDate: (selectedDate: Date | null) => void
  showPreviousYearOverlay: boolean
  setShowPreviousYearOverlay: (showPreviousYearOverlay: boolean) => void
  showPreviousYearFunding: boolean
  setShowPreviousYearFunding: (showPreviousYearFunding: boolean) => void
  showPreviousYearForm: boolean
  setShowPreviousYearForm: (showPreviousYearForm: boolean) => void
  showPreviousYearMethod: boolean
  setShowPreviousYearMethod: (showPreviousYearMethod: boolean) => void
  campaignYear: number
  setCampaignYear: (nextYear: unknown) => void
}

export function useDashboardSettings(): UseDashboardSettingsResult {
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
