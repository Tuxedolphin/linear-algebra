import { afterEach, describe, expect, it, vi } from 'vitest'

import { compute, equivalent } from './api'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(payload: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status,
      json: async () => payload,
    })),
  )
}

describe('api client', () => {
  it('posts compute requests to the v2 endpoint', async () => {
    const payload = { operation: 'rref', blocks: [], steps: [] }
    mockFetch(payload)

    await expect(
      compute({ operation: 'rref', matrixA: '[1 2; 3 4]', output: 'exact' }),
    ).resolves.toEqual(payload)

    expect(fetch).toHaveBeenCalledWith(
      '/api/v2/compute',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          operation: 'rref',
          matrixA: '[1 2; 3 4]',
          output: 'exact',
        }),
      }),
    )
  })

  it('surfaces structured backend errors', async () => {
    mockFetch({ error: { code: 'parse', message: 'Invalid matrix.' } }, false, 400)

    await expect(equivalent('[1 2')).rejects.toThrow('Invalid matrix.')
  })
})
