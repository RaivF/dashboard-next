import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { getSpecialtyLevel, parseSpecialtiesMxl } from '../src/entities/specialties/lib/specialties.js'

describe('specialties mxl parser', () => {
  it('extracts all directions from the public reference file', () => {
    const rows = parseSpecialtiesMxl(readFileSync('public/specialties.mxl'))

    assert.equal(rows.length, 186)
    assert.equal(rows[0].code, '38.03.01')
    assert.equal(rows[0].level, getSpecialtyLevel('38.03.01'))
    assert.ok(rows.some((item) => item.code === '35.03.11'))
    assert.ok(rows.some((item) => item.code === '19.04.01'))
    assert.equal(rows.filter((item) => item.code === '40.02.04').length, 3)
  })

  it('maps specialty level from the middle code segment', () => {
    assert.notEqual(getSpecialtyLevel('35.03.04'), getSpecialtyLevel('35.04.04'))
    assert.notEqual(getSpecialtyLevel('35.04.04'), getSpecialtyLevel('38.05.01'))
  })
})
