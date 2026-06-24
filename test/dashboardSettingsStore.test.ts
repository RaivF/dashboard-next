import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  }
}

const memoryStorage = createMemoryStorage()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: memoryStorage,
})

const {
  getCampaignYear,
  useDashboardSettingsStore,
} = await import('../src/features/dashboard-settings/model/dashboardSettingsStore.js')

const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (String(args[0]).includes('dashboard-settings-state')) return
  originalWarn(...args)
}

describe('dashboard settings store', () => {
  it('clamps campaign year and resets selected date when campaign changes', () => {
    useDashboardSettingsStore.setState({
      period: '2025-01',
      range: 'month',
      selectedDate: new Date(2025, 6, 1),
    })

    useDashboardSettingsStore.getState().setCampaignYear(2035)

    const state = useDashboardSettingsStore.getState()
    assert.equal(state.period, '2026-01')
    assert.equal(state.selectedDate, null)
    assert.equal(getCampaignYear(state.period), 2026)
  })

  it('keeps display range local to the typed range options', () => {
    useDashboardSettingsStore.getState().setRange('twoWeeks')

    assert.equal(useDashboardSettingsStore.getState().range, 'twoWeeks')
  })
})
