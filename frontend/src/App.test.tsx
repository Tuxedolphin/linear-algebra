import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'
import { ResultsPanel } from './components/ResultsPanel'
import { useCalculatorStore } from './store/calculator'

vi.mock('./lib/math', () => ({
  MathTex: ({ latex }: { latex: string }) => <span>{latex}</span>,
  InlineStatement: ({ source }: { source: string }) => <span>{source}</span>,
}))

describe('App', () => {
  it('mounts the workspace without crashing', () => {
    render(<App />)
    expect(screen.getByText('MA1522')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compute' })).toBeInTheDocument()
  })

  it('renders the operation listbox with the default selection', () => {
    render(<App />)
    const listbox = screen.getByRole('listbox', { name: 'Operations' })
    const selected = within(listbox).getAllByRole('option', { selected: true })
    expect(selected).toHaveLength(1)
  })

  it('renders an editable matrix grid for Matrix A', () => {
    render(<App />)
    // The default operation seeds a 3x3 sample, so cell (1,1) must exist.
    expect(
      screen.getByLabelText('Matrix A row 1 column 1'),
    ).toBeInTheDocument()
  })

  it('keeps the history drawer mounted when closed so its exit animation can run', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByRole('dialog', { name: 'History' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(
      screen.getByText('Previously computed operations. Select one to restore its inputs and result.'),
    ).toBeInTheDocument()
  })

  it('keeps the history trigger name stable when entries exist', () => {
    useCalculatorStore.setState({
      history: [
        {
          id: 'history-1',
          ts: Date.now(),
          operation: 'rref',
          label: 'Reduced row echelon form',
          matrixA: '[1 0; 0 1]',
          matrixB: '',
          matrixC: '',
          rhs: '',
          k: 2,
          mods: { m1: 'none', m2: 'none', m3: 'none' },
          output: 'exact',
          result: { operation: 'rref', blocks: [], steps: [] },
        },
      ],
    })

    render(<App />)

    expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument()
  })

  it('gives result action buttons result-specific accessible names', () => {
    useCalculatorStore.setState({
      result: {
        operation: 'rref',
        blocks: [
          {
            kind: 'matrix',
            label: 'Reduced row echelon form',
            raw: '[1 0; 0 1]',
            latex: '\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}',
          },
        ],
        steps: [],
      },
      error: null,
      isComputing: false,
    })

    render(<ResultsPanel />)

    expect(
      screen.getByRole('button', { name: 'Copy Reduced row echelon form' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Load Reduced row echelon form into Matrix A' }),
    ).toBeInTheDocument()
  })
})
