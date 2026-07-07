import { create } from 'zustand'
import { MAX_CAMPAIGN_YEAR, clampCampaignYear } from './periodConfig.js'
import type { RangeValue } from './periodConfig.js'

type DashboardSettingsState = {
  period: string
  range: RangeValue
  selectedDate: Date | null
  showPreviousYearOverlay: boolean
  showPreviousYearFunding: boolean
  showPreviousYearForm: boolean
  showPreviousYearMethod: boolean
  setRange: (range: RangeValue) => void
  setSelectedDate: (selectedDate: Date | null) => void
  setShowPreviousYearOverlay: (showPreviousYearOverlay: boolean) => void
  setShowPreviousYearFunding: (showPreviousYearFunding: boolean) => void
  setShowPreviousYearForm: (showPreviousYearForm: boolean) => void
  setShowPreviousYearMethod: (showPreviousYearMethod: boolean) => void
  setCampaignYear: (nextYear: unknown) => void
}

function toCampaignPeriod(year: number): string {
  return `${year}-01`
}

function getDefaultPeriod(): string {
  return toCampaignPeriod(MAX_CAMPAIGN_YEAR)
}

function getDefaultRange(): RangeValue {
  return 'actual'
}

function getDefaultPreviousYearOverlay(): boolean {
  return true
}

function getDefaultPreviousYearFunding(): boolean {
  return true
}

function getDefaultPreviousYearForm(): boolean {
  return false
}

function getDefaultPreviousYearMethod(): boolean {
  return false
}

export function getCampaignYear(periodValue: string | null | undefined): number {
  const fallbackYear = new Date().getFullYear()
  const year = Number.parseInt(String(periodValue || '').slice(0, 4), 10)
  return clampCampaignYear(Number.isFinite(year) ? year : fallbackYear)
}

export const useDashboardSettingsStore = create<DashboardSettingsState>()((set) => ({
  period: getDefaultPeriod(),
  range: getDefaultRange(),
  selectedDate: null,
  showPreviousYearOverlay: getDefaultPreviousYearOverlay(),
  showPreviousYearFunding: getDefaultPreviousYearFunding(),
  showPreviousYearForm: getDefaultPreviousYearForm(),
  showPreviousYearMethod: getDefaultPreviousYearMethod(),
  setRange: () => set({ range: 'actual' }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setShowPreviousYearOverlay: (showPreviousYearOverlay) => set({ showPreviousYearOverlay }),
  setShowPreviousYearFunding: (showPreviousYearFunding) => set({ showPreviousYearFunding }),
  setShowPreviousYearForm: (showPreviousYearForm) => set({ showPreviousYearForm }),
  setShowPreviousYearMethod: (showPreviousYearMethod) => set({ showPreviousYearMethod }),
  setCampaignYear: (nextYear) =>
    set({
      period: toCampaignPeriod(clampCampaignYear(nextYear)),
      selectedDate: null,
    }),
}))
