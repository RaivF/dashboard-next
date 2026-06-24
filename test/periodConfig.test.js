import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  MAX_CAMPAIGN_YEAR,
  MIN_CAMPAIGN_YEAR,
  clampCampaignYear,
} from '../src/features/dashboard-settings/model/periodConfig.js'

describe('dashboard campaign year limits', () => {
  it('allows only the 2025 and 2026 admission campaigns', () => {
    assert.equal(clampCampaignYear(2024), MIN_CAMPAIGN_YEAR)
    assert.equal(clampCampaignYear(2025), 2025)
    assert.equal(clampCampaignYear(2026), 2026)
    assert.equal(clampCampaignYear(2027), MAX_CAMPAIGN_YEAR)
  })
})
