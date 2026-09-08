import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildAnalytics, fullDate, shortDate } from '../src/entities/applicants/lib/analytics.js'
import { CAMPAIGN_RESULTS_2026 } from '../src/entities/campaign-results/index.js'
import { applyCampaignResults2026 } from '../src/widgets/dashboard/lib/applyCampaignResults2026.js'

const presentation = CAMPAIGN_RESULTS_2026

describe('dashboard synchronization with the 2026 presentation', () => {
  it('synchronizes the final snapshot while preserving people, non-quota funding and original data', () => {
    const analytics = buildAnalytics({
      manual_summary: {
        applicationsTotal: 17_856,
        onlineChannels: 1_062,
      },
      manual_applicants_by_date: [
        { date: '2026-06-20', quantity: 134 },
        { date: '2026-08-17', quantity: 5_429 },
      ],
      manual_funding_by_date: [
        {
          date: '2026-08-17',
          categories: [
            { name: 'Бюджетная основа', quantity: 5_198 },
          ],
        },
      ],
      manual_method: [
        { name: 'Лично', quantity: 14_168 },
        { name: 'Онлайн-каналы', quantity: 1_062 },
      ],
      manual_top_specialties: [
        { name: 'Старое направление', code: '00.00.00', caption: 'Код: 00.00.00', quantity: 746 },
      ],
      manual_bottom_specialties: [
        { name: 'Старый минимум', code: '00.00.01', caption: 'Код: 00.00.01', quantity: 2 },
      ],
      manual_previous_year_applicants_by_date: [
        { date: '2025-06-20', quantity: 67 },
        { date: '2025-08-10', quantity: 116 },
      ],
      manual_previous_year_funding_by_date: [
        { date: '2025-08-10', categories: [{ name: 'Бюджетная основа', quantity: 183 }] },
      ],
    }, 'actual')
    analytics.byApplicationForm = [
      { name: 'Очная', quantity: 13_719 },
      { name: 'Заочная', quantity: 2_346 },
      { name: 'Очно-заочная', quantity: 1_791 },
    ]
    const original = structuredClone(analytics)

    const synchronized = applyCampaignResults2026(analytics, 2026)

    assert.equal(synchronized.applicationsTotal, presentation.applications.total)
    assert.equal(synchronized.rangeText, presentation.source.periodLabel)
    assert.equal(synchronized.rangeStart?.toISOString(), '2026-06-20T00:00:00.000Z')
    assert.equal(synchronized.rangeEnd?.toISOString(), '2026-08-31T00:00:00.000Z')
    assert.equal(synchronized.latestDate, '31 августа 2026 г.')
    assert.equal(synchronized.latestQuantity, 0)
    assert.equal(synchronized.latestDelta, 0)
    assert.equal(synchronized.latestDeltaPercent, 0)
    assert.deepEqual(
      synchronized.byMethod.map(({ name, quantity }) => [name, quantity]),
      presentation.applications.methods.map(({ name, current }) => [name, current]),
    )
    assert.equal(synchronized.online, 2_742)
    assert.equal(synchronized.personal, 14_168)
    assert.equal(synchronized.byMethod.reduce((sum, row) => sum + row.quantity, 0), synchronized.applicationsTotal)
    assert.equal(synchronized.byPriority.length, 15)
    assert.equal(synchronized.byPriority.reduce((sum, row) => sum + row.quantity, 0), 16_908)
    assert.deepEqual(
      synchronized.topSpecialties.map(({ quantity }) => quantity),
      presentation.demand.topApplications.map(({ value }) => value),
    )
    assert.deepEqual(
      synchronized.bottomSpecialties.map(({ quantity }) => quantity),
      presentation.demand.lowestApplications.map(({ value }) => value),
    )

    assert.equal(synchronized.total, 5_563)
    assert.equal(synchronized.uniqueApplicants, 5_563)
    assert.equal(synchronized.budget, analytics.budget)
    assert.equal(synchronized.applicationsPerApplicant, 16_910 / 5_563)
    assert.equal(synchronized.byDate.reduce((sum, point) => sum + point.quantity, 0), synchronized.total)
    assert.equal(synchronized.byDate.length, 73)
    assert.deepEqual(synchronized.byDate.slice(0, analytics.byDate.length), analytics.byDate)
    const addedDays = synchronized.byDate.filter((point) => point.date > '2026-08-17')
    assert.equal(addedDays.length, 14)
    assert.equal(addedDays[0].date, '2026-08-18')
    assert.equal(addedDays.at(-1)?.date, '2026-08-31')
    assert.ok(addedDays.every((point) => point.quantity === 0 && !point.isMissing))
    for (const point of synchronized.byDate) {
      assert.equal(point.label, shortDate(point.date))
      assert.equal(point.fullLabel, fullDate(point.date))
    }

    assert.equal(synchronized.previousYearByDate.length, synchronized.byDate.length)
    for (const [index, point] of synchronized.previousYearByDate.entries()) {
      const current = synchronized.byDate[index]
      assert.equal(point.date, current.date)
      assert.equal(point.label, current.label)
      assert.equal(point.fullLabel, current.fullLabel)
      assert.equal(point.previousDate, current.date.replace('2026-', '2025-'))
      assert.equal(point.previousFullLabel, fullDate(point.previousDate))
    }
    assert.deepEqual(synchronized.previousYearByDate.slice(0, analytics.previousYearByDate.length), analytics.previousYearByDate)
    assert.ok(synchronized.previousYearByDate.slice(analytics.previousYearByDate.length)
      .every((point) => point.quantity === 0 && point.isMissing))
    assert.equal(synchronized.previousYearComparison.previousPeriodText, '20 июня 2025 г. — 31 августа 2025 г.')
    assert.equal(synchronized.previousYearComparison.previous, analytics.previousYearComparison.previous)
    assert.deepEqual(synchronized.byApplicationForm, [
      { name: 'Очная', quantity: 12_992 },
      { name: 'Заочная', quantity: 2_222 },
      { name: 'Очно-заочная', quantity: 1_696 },
    ])
    assert.equal(synchronized.byApplicationForm.reduce((sum, row) => sum + row.quantity, 0), synchronized.applicationsTotal)
    assert.deepEqual(synchronized.byFunding.filter((row) => !row.name.includes('квота')), analytics.byFunding.filter((row) => !row.name.includes('квота')))
    assert.deepEqual(synchronized.previousYearByFunding.filter((row) => !row.name.includes('квота')), analytics.previousYearByFunding.filter((row) => !row.name.includes('квота')))
    assert.deepEqual(analytics, original)
    assert.deepEqual(applyCampaignResults2026(synchronized, 2026), synchronized)
  })

  it('does not invent people or daily observations before a source snapshot is loaded', () => {
    const synchronized = applyCampaignResults2026(buildAnalytics(null, 'actual'), 2026)

    assert.equal(synchronized.applicationsTotal, 16_910)
    assert.equal(synchronized.total, 0)
    assert.equal(synchronized.uniqueApplicants, 0)
    assert.equal(synchronized.applicationsPerApplicant, 0)
    assert.equal(synchronized.latestDate, 'Нет данных')
    assert.equal(synchronized.latestQuantity, 0)
    assert.deepEqual(synchronized.byDate, [])
    assert.deepEqual(synchronized.previousYearByDate, [])
    assert.deepEqual(synchronized.byFunding, [])
  })

  it('keeps unknown days missing when the source does not contain the confirmed snapshot', () => {
    const analytics = buildAnalytics({
      manual_applicants_by_date: [{ date: '2026-08-01', quantity: 10 }],
    }, 'actual')
    const synchronized = applyCampaignResults2026(analytics, 2026)

    assert.equal(synchronized.byDate.reduce((sum, point) => sum + point.quantity, 0), 10)
    assert.ok(synchronized.byDate.filter((point) => point.date > '2026-08-01')
      .every((point) => point.quantity === 0 && point.isMissing))
    assert.deepEqual(synchronized.previousYearByDate, [])
  })

  it('handles a loaded snapshot with zero people without dividing by zero', () => {
    const analytics = buildAnalytics({
      manual_applicants_by_date: [{ date: '2026-08-17', quantity: 0 }],
    }, 'actual')
    const synchronized = applyCampaignResults2026(analytics, 2026)

    assert.equal(synchronized.total, 0)
    assert.equal(synchronized.applicationsPerApplicant, 0)
    assert.equal(synchronized.byDate.reduce((sum, point) => sum + point.quantity, 0), 0)
    assert.ok(synchronized.byDate.filter((point) => point.date >= '2026-08-17')
      .every((point) => point.quantity === 0 && !point.isMissing))
  })

  it('does not apply the 2026 snapshot to another campaign year', () => {
    const analytics = buildAnalytics({
      manual_summary: { applicationsTotal: 123 },
      manual_applicants_by_date: [{ date: '2025-08-17', quantity: 45 }],
    })

    assert.equal(applyCampaignResults2026(analytics, 2025), analytics)
  })

  for (const campaignYear of [2025, 2026]) {
    it(`uses the upper quota summary in both funding columns for campaign ${campaignYear}`, () => {
      const analytics = buildAnalytics(null, 'actual')
      analytics.byFunding = [
        { name: 'Бюджетная основа', quantity: 5_198 },
        { name: 'Платное обучение', quantity: 535 },
        { name: 'Целевая квота', quantity: 0 },
        { name: 'Отдельная квота (СВО)', quantity: 189 },
        { name: 'Особая квота', quantity: 158 },
      ]
      analytics.previousYearByFunding = [
        { name: 'Бюджетная основа', quantity: 2_342 },
        { name: 'Платное обучение', quantity: 79 },
        { name: 'Целевая квота', quantity: 10 },
        { name: 'Отдельная квота (СВО)', quantity: 7 },
        { name: 'Особая квота', quantity: 15 },
      ]
      const original = structuredClone(analytics)
      const synchronized = applyCampaignResults2026(analytics, campaignYear)

      for (const [rows, year, sourceRows] of [
        [synchronized.byFunding, campaignYear, analytics.byFunding],
        [synchronized.previousYearByFunding, campaignYear - 1, analytics.previousYearByFunding],
      ] as const) {
        const summary = presentation.quotas.enrolledByYear.find((item) => item.year === year)!
        assert.deepEqual(rows.slice(0, 2), sourceRows.slice(0, 2))
        assert.deepEqual(rows.slice(2), [
          { name: 'Целевая квота', quantity: summary.target },
          { name: 'Отдельная квота (СВО)', quantity: summary.separate },
          { name: 'Особая квота', quantity: summary.special },
        ])
      }
      assert.equal(synchronized.target, synchronized.byFunding[2].quantity)
      assert.equal(synchronized.budget, analytics.budget)
      assert.equal(synchronized.paid, analytics.paid)
      assert.deepEqual(analytics, original)
      assert.deepEqual(applyCampaignResults2026(synchronized, campaignYear), synchronized)
    })
  }
})
