import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeHttpError } from '../src/shared/api/httpClient.js'
import type { NormalizedHttpError } from '../src/shared/api/httpClient.js'

function assertHttpError(error: unknown): asserts error is NormalizedHttpError {
  assert.equal(typeof error, 'object')
  assert.notEqual(error, null)
  assert.equal((error as { name?: unknown }).name, 'HttpError')
}

describe('http client', () => {
  it('normalizes response errors without exposing raw transport details as the message', () => {
    const error = normalizeHttpError({
      message: 'Request failed',
      response: {
        status: 503,
        data: {
          message: 'Service unavailable',
        },
      },
    })

    assertHttpError(error)
    assert.equal(error.status, 503)
    assert.equal(error.message, 'Service unavailable')
  })

  it('falls back to an HTTP status message when response body has no message', () => {
    const error = normalizeHttpError({
      message: 'Network wrapper message',
      response: {
        status: 500,
        data: {},
      },
    })

    assertHttpError(error)
    assert.equal(error.message, 'HTTP 500')
  })
})
