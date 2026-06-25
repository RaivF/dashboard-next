import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

type PersistedDashboardSettingsState = Pick<
  DashboardSettingsState,
  | 'period'
  | 'range'
  | 'showPreviousYearOverlay'
  | 'showPreviousYearFunding'
  | 'showPreviousYearForm'
  | 'showPreviousYearMethod'
>

function getStorageItem(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

function toCampaignPeriod(year: number): string {
  return `${year}-01`
}

function getDefaultPeriod(): string {
  const savedPeriod = getStorageItem('dashboard-period') || toCampaignPeriod(MAX_CAMPAIGN_YEAR)
  const savedYear = Number.parseInt(String(savedPeriod).slice(0, 4), 10)
  return toCampaignPeriod(clampCampaignYear(savedYear))
}

function migrateDashboardSettings(persistedState: unknown): PersistedDashboardSettingsState {
  const state =
    persistedState && typeof persistedState === 'object'
      ? (persistedState as Partial<PersistedDashboardSettingsState>)
      : {}

  return {
    ...state,
    period:
      state.period === '2025-01' || !state.period
        ? toCampaignPeriod(MAX_CAMPAIGN_YEAR)
        : toCampaignPeriod(clampCampaignYear(Number.parseInt(String(state.period).slice(0, 4), 10))),
    range: 'actual',
  } as PersistedDashboardSettingsState
}

function getDefaultRange(): RangeValue {
  return 'actual'
}

function getDefaultPreviousYearOverlay(): boolean {
  return getStorageItem('dashboard-previous-year-overlay') !== 'false'
}

function getDefaultPreviousYearFunding(): boolean {
  return getStorageItem('dashboard-previous-year-funding') !== 'false'
}

function getDefaultPreviousYearForm(): boolean {
  return getStorageItem('dashboard-previous-year-form') === 'true'
}

function getDefaultPreviousYearMethod(): boolean {
  return getStorageItem('dashboard-previous-year-method') === 'true'
}

export function getCampaignYear(periodValue: string | null | undefined): number {
  const fallbackYear = new Date().getFullYear()
  const year = Number.parseInt(String(periodValue || '').slice(0, 4), 10)
  return clampCampaignYear(Number.isFinite(year) ? year : fallbackYear)
}

export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist<DashboardSettingsState, [], [], PersistedDashboardSettingsState>(
    (set) => ({
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
    }),
    {
      name: 'dashboard-settings-state',
      version: 2,
      migrate: migrateDashboardSettings,
      partialize: (state) => ({
        period: state.period,
        range: 'actual',
        showPreviousYearOverlay: state.showPreviousYearOverlay,
        showPreviousYearFunding: state.showPreviousYearFunding,
        showPreviousYearForm: state.showPreviousYearForm,
        showPreviousYearMethod: state.showPreviousYearMethod,
      }),
    },
  ),
)
