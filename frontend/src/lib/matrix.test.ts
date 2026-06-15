import { describe, expect, it } from 'vitest'

import { parseGrid, parsePastedGrid, serializeGrid } from './matrix'

describe('parseGrid', () => {
  it('parses space-separated bracket format', () => {
    expect(parseGrid('[1 2; 3 4]')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('parses comma-separated rows', () => {
    expect(parseGrid('[1,2,3; 4,5,6]')).toEqual([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])
  })

  it('keeps exact expressions intact', () => {
    expect(parseGrid('[sqrt(2) pi; 5^(1/3) 0]')).toEqual([
      ['sqrt(2)', 'pi'],
      ['5^(1/3)', '0'],
    ])
  })

  it('pads ragged rows into a rectangle', () => {
    expect(parseGrid('[1 2; 3]')).toEqual([
      ['1', '2'],
      ['3', ''],
    ])
  })

  it('falls back to a single empty cell for empty input', () => {
    expect(parseGrid('')).toEqual([['']])
    expect(parseGrid('[]')).toEqual([['']])
  })
})

describe('serializeGrid', () => {
  it('round-trips a parsed grid', () => {
    expect(serializeGrid(parseGrid('[1 2; 3 4]'))).toBe('[1 2; 3 4]')
  })

  it('defaults empty cells to zero', () => {
    expect(
      serializeGrid([
        ['1', ''],
        ['', '4'],
      ]),
    ).toBe('[1 0; 0 4]')
  })
})

describe('parsePastedGrid', () => {
  it('parses tab-separated spreadsheet blocks', () => {
    expect(parsePastedGrid('1\t2\n3\t4')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('returns null for a single token (ordinary edit)', () => {
    expect(parsePastedGrid('42')).toBeNull()
  })

  it('accepts bracket-format pastes', () => {
    expect(parsePastedGrid('[1 2; 3 4]')).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })
})
