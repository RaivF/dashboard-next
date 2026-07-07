import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  getCampaignYear,
  useDashboardSettingsStore,
} = await import('../src/features/dashboard-settings/model/dashboardSettingsStore.js')

describe('dashboard settings store', () => {
  it('clamps campaign year and resets selected date when campaign changes', () => {
    useDashboardSettingsStore.setState({
      period: '2025-01',
      range: 'actual',
      selectedDate: new Date(2025, 6, 1),
    })

    useDashboardSettingsStore.getState().setCampaignYear(2035)

    const state = useDashboardSettingsStore.getState()
    assert.equal(state.period, '2026-01')
    assert.equal(state.selectedDate, null)
    assert.equal(getCampaignYear(state.period), 2026)
  })

  it('keeps display range locked to actual', () => {
    useDashboardSettingsStore.getState().setRange('actual')

    assert.equal(useDashboardSettingsStore.getState().range, 'actual')
  })
})
