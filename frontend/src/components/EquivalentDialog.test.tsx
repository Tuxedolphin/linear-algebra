import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { equivalent } from '../lib/api'
import type { EquivalentResponse } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'
import { EquivalentDialog } from './EquivalentDialog'

vi.mock('../lib/api', () => ({
  equivalent: vi.fn(),
}))

vi.mock('../lib/math', () => ({
  InlineStatement: ({ source }: { source: string }) => <span>{source}</span>,
}))

const equivalentMock = vi.mocked(equivalent)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

describe('EquivalentDialog', () => {
  beforeEach(() => {
    equivalentMock.mockReset()
    useCalculatorStore.setState({
      matrixA: '[1 0; 0 1]',
    })
  })

  it('ignores an in-flight response after Matrix A changes', async () => {
    const stale = deferred<EquivalentResponse>()
    const fresh = deferred<EquivalentResponse>()
    equivalentMock
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise)

    render(<EquivalentDialog />)

    fireEvent.click(screen.getByRole('button', { name: /equivalent statements/i }))
    expect(equivalentMock).toHaveBeenCalledWith('[1 0; 0 1]')

    act(() => {
      useCalculatorStore.setState({ matrixA: '[2 0; 0 2]' })
    })

    await waitFor(() => {
      expect(equivalentMock).toHaveBeenCalledWith('[2 0; 0 2]')
    })

    await act(async () => {
      stale.resolve({
        category: 'Stale matrix',
        properties: { rows: 2, cols: 2, rank: 2, nullity: 0 },
        statements: ['stale response'],
      })
    })

    expect(screen.queryByText('stale response')).not.toBeInTheDocument()

    await act(async () => {
      fresh.resolve({
        category: 'Fresh matrix',
        properties: { rows: 2, cols: 2, rank: 2, nullity: 0 },
        statements: ['fresh response'],
      })
    })

    expect(await screen.findByText('fresh response')).toBeInTheDocument()
    expect(screen.queryByText('stale response')).not.toBeInTheDocument()
  })
})
