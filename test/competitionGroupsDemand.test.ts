import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeCompetitionGroupsDemand } from '../server/src/services/competitionGroupsDemandService.js'

describe('competition groups demand', () => {
  it('aggregates Melsu competition groups by speciality and excludes branches', () => {
    const demand = normalizeCompetitionGroupsDemand({
      campaign_year: 2026,
      snapshot_at: '2026-07-28T08:31:59.023496Z',
      items: [
        {
          speciality_code: '01.03.05',
          speciality_name: 'Статистика',
          kcp: 2,
          applications_total: 2,
          applications_primary: 1,
          applications_backup: 1,
          applications_total_consent: 1,
          applications_primary_consent: 1,
          applications_backup_consent: 0,
          department_label: null,
        },
        {
          speciality_code: '01.03.05',
          speciality_name: 'Статистика',
          kcp: 3,
          applications_total: 6,
          applications_primary: 4,
          applications_backup: 2,
          applications_total_consent: 4,
          applications_primary_consent: 3,
          applications_backup_consent: 1,
          department_label: null,
        },
        {
          speciality_code: '01.03.05',
          speciality_name: 'Статистика',
          kcp: 100,
          applications_total: 100,
          department_label: 'Энергодарский филиал',
        },
        {
          speciality_code: '01.04.05',
          speciality_name: 'Магистратура статистики',
          kcp: 10,
          applications_primary_consent: 9,
          department_label: null,
        },
      ],
    }, 2026)

    assert.equal(demand.plan, 3128)
    assert.equal(demand.current, 4)
    assert.equal(demand.snapshotAt, '2026-07-28T08:31:59.023496Z')
    assert.equal(demand.directions.length, 2)
    assert.deepEqual(demand.directions[0], {
      code: '01.03.05',
      name: 'Статистика',
      plan: 5,
      current: 4,
      applicationsPrimary: 5,
      applicationsBackup: 3,
      applicationsTotal: 8,
      applicationsPrimaryConsent: 4,
      applicationsBackupConsent: 1,
      applicationsTotalConsent: 5,
      percent: 80,
      fillPercent: 80,
      remaining: 1,
      overflow: 0,
    })
    assert.equal(demand.percent, 4 / 3128 * 100)
    assert.equal(demand.directions[1].current, 9)
  })
})
