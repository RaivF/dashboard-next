import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CAMPAIGN_RESULTS_2026,
  getCompletionPercent,
  sumValues,
} from '../src/entities/campaign-results/index.js'
import CampaignResults2026 from '../src/widgets/dashboard/ui/CampaignResults2026.js'

const results = CAMPAIGN_RESULTS_2026

function sum<T>(rows: readonly T[], getValue: (row: T) => number): number {
  return rows.reduce((total, row) => total + getValue(row), 0)
}

function assertUniqueIds(rows: readonly { id: string }[]) {
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length)
}

describe('campaign results 2026 presentation snapshot', () => {
  it('keeps the presentation snapshot and education totals internally consistent', () => {
    assert.equal(results.source.snapshotDate, '2026-08-31')
    assert.equal(results.higherEducation.plan, 4_658)
    assert.equal(results.higherEducation.enrolled, 4_658)
    assert.equal(sum(results.higherEducation.levels, (row) => row.plan), 4_658)
    assert.equal(sum(results.higherEducation.levels, (row) => row.enrolled), 4_658)
    assert.equal(getCompletionPercent(results.higherEducation.enrolled, results.higherEducation.plan), 100)
    assert.equal(results.secondaryVocational.plan, 650)
    assert.equal(results.secondaryVocational.enrolled, 425)
    assert.equal(Number(getCompletionPercent(425, 650).toFixed(1)), 65.4)
  })

  it('reconciles applications, branches and the documented priority gap', () => {
    assert.equal(sum(results.applications.methods, (row) => row.current), results.applications.total)
    assert.equal(sum(results.branches, (row) => row.planSpo), results.secondaryVocational.plan)
    assert.equal(sum(results.branches, (row) => row.enrolledSpo), results.secondaryVocational.enrolled)

    const priorityTotal = sumValues(results.applications.priorities)
    assert.equal(priorityTotal, 16_908)
    assert.equal(results.applications.total - priorityTotal, 2)
  })

  it('contains the 2026 quota totals and stable ranking identifiers', () => {
    assert.deepEqual(results.quotas.enrolledByYear.at(-1), {
      year: 2026,
      special: 120,
      separate: 127,
      target: 1,
    })

    assertUniqueIds(results.higherEducation.levels)
    assertUniqueIds(results.applications.methods)
    assertUniqueIds(results.applications.priorities)
    assertUniqueIds(results.demand.topApplications)
    assertUniqueIds(results.demand.lowestApplications)
    assertUniqueIds(results.demand.peoplePerPlace)
    assertUniqueIds(results.demand.applicationsPerPlace)
    assertUniqueIds(results.branches)
  })

  it('renders the authoritative snapshot with accessible date and scope labels', () => {
    const html = renderToStaticMarkup(<CampaignResults2026 />)

    assert.match(html, /id="campaign-results-title"/)
    assert.match(html, /data-manual-edit-ignore="true"/)
    assert.match(html, /dateTime="2026-08-31"/)
    assert.match(html, /Официальный итог/)
    assert.match(html, /Данные зафиксированы на/)
    assert.match(html, /Открыть остальные показатели презентации/)
  })
})
