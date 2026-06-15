import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('mounts the workspace without crashing', () => {
    render(<App />)
    expect(screen.getByText('MA1522')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compute/i })).toBeInTheDocument()
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
})
