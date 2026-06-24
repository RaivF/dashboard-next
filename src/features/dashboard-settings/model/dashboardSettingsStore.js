import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RANGE_OPTIONS, clampCampaignYear } from './periodConfig.js'

function getStorageItem(key) {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

function toCampaignPeriod(year) {
  return `${year}-01`
}

function getDefaultPeriod() {
  const savedPeriod = getStorageItem('dashboard-period') || '2025-01'
  const savedYear = Number.parseInt(String(savedPeriod).slice(0, 4), 10)
  return toCampaignPeriod(clampCampaignYear(savedYear))
}

function getDefaultRange() {
  const savedRange = getStorageItem('dashboard-range')
  return RANGE_OPTIONS.some((option) => option.value === savedRange) ? savedRange : 'actual'
}

function getDefaultPreviousYearOverlay() {
  return getStorageItem('dashboard-previous-year-overlay') !== 'false'
}

function getDefaultPreviousYearFunding() {
  return getStorageItem('dashboard-previous-year-funding') !== 'false'
}

function getDefaultPreviousYearForm() {
  return getStorageItem('dashboard-previous-year-form') === 'true'
}

function getDefaultPreviousYearMethod() {
  return getStorageItem('dashboard-previous-year-method') === 'true'
}

export function getCampaignYear(periodValue) {
  const fallbackYear = new Date().getFullYear()
  const year = Number.parseInt(String(periodValue || '').slice(0, 4), 10)
  return clampCampaignYear(Number.isFinite(year) ? year : fallbackYear)
}

export const useDashboardSettingsStore = create(
  persist(
    (set) => ({
      period: getDefaultPeriod(),
      range: getDefaultRange(),
      selectedDate: null,
      showPreviousYearOverlay: getDefaultPreviousYearOverlay(),
      showPreviousYearFunding: getDefaultPreviousYearFunding(),
      showPreviousYearForm: getDefaultPreviousYearForm(),
      showPreviousYearMethod: getDefaultPreviousYearMethod(),
      setRange: (range) => set({ range }),
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
      partialize: (state) => ({
        period: state.period,
        range: state.range,
        showPreviousYearOverlay: state.showPreviousYearOverlay,
        showPreviousYearFunding: state.showPreviousYearFunding,
        showPreviousYearForm: state.showPreviousYearForm,
        showPreviousYearMethod: state.showPreviousYearMethod,
      }),
    },
  ),
)
