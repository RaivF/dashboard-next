import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { KCP_SORT_OPTIONS } from '../src/widgets/dashboard/lib/kcpProgress.js'

describe('KCP progress labels', () => {
  it('uses readable Russian labels for all sorting controls', () => {
    assert.deepEqual(KCP_SORT_OPTIONS.map((option) => option.label), [
      'Заполненность ↑',
      'Заполненность ↓',
      'А–Я',
      'КЦП ↓',
    ])
  })
})
