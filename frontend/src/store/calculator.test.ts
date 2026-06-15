import { beforeEach, describe, expect, it } from 'vitest'

import { useCalculatorStore, type HistoryEntry } from './calculator'

const sampleEntry: HistoryEntry = {
  id: 'entry-1',
  ts: 1_000,
  operation: 'det',
  label: 'Determinant',
  matrixA: '[2 1; 1 2]',
  matrixB: '',
  matrixC: '',
  rhs: '',
  k: 2,
  mods: { m1: 'none', m2: 'none', m3: 'none' },
  output: 'decimal',
  result: { operation: 'det', blocks: [], steps: [] },
}

describe('history', () => {
  beforeEach(() => {
    useCalculatorStore.setState({
      history: [],
      operation: 'rref',
      matrixA: '[1 0; 0 1]',
      output: 'exact',
      result: null,
      error: 'stale error',
    })
  })

  it('restores a full input + result snapshot from an entry', () => {
    useCalculatorStore.setState({ history: [sampleEntry] })
    useCalculatorStore.getState().restoreFromHistory('entry-1')

    const state = useCalculatorStore.getState()
    expect(state.operation).toBe('det')
    expect(state.matrixA).toBe('[2 1; 1 2]')
    expect(state.output).toBe('decimal')
    expect(state.result).toEqual(sampleEntry.result)
    expect(state.error).toBeNull()
  })

  it('ignores an unknown entry id', () => {
    useCalculatorStore.setState({ history: [sampleEntry] })
    useCalculatorStore.getState().restoreFromHistory('missing')
    expect(useCalculatorStore.getState().operation).toBe('rref')
  })

  it('clears all history', () => {
    useCalculatorStore.setState({ history: [sampleEntry] })
    useCalculatorStore.getState().clearHistory()
    expect(useCalculatorStore.getState().history).toHaveLength(0)
  })
})
