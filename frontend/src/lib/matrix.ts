// Conversion between the canonical bracket wire format (`[1 2; 3 4]`) used by
// the store and backend, and the 2D string grid the editor works with.
// Cells are kept as raw strings so exact expressions (sqrt(2), pi, 5^(1/3))
// survive a round trip untouched.

export type Grid = string[][]

/** Parse a bracket-format matrix string into a rectangular grid of cell strings. */
export function parseGrid(value: string): Grid {
  const body = value.trim().replace(/^\[+/, '').replace(/\]+$/, '').trim()
  if (!body) return [['']]

  const grid = body
    .split(';')
    .map((row) => row.trim())
    .filter((row) => row.length > 0)
    .map((row) => {
      const cells = row.includes(',') ? row.split(',') : row.split(/\s+/)
      return cells.map((cell) => cell.trim()).filter((cell) => cell.length > 0)
    })

  if (grid.length === 0) return [['']]

  // Normalise to a rectangle so the editor never renders ragged rows.
  const cols = Math.max(1, ...grid.map((row) => row.length))
  return grid.map((row) => {
    const padded = [...row]
    while (padded.length < cols) padded.push('')
    return padded
  })
}

/** Serialise a grid back to bracket format. Empty cells default to 0. */
export function serializeGrid(grid: Grid): string {
  const rows = grid.map((row) =>
    row.map((cell) => (cell.trim() === '' ? '0' : cell.trim())).join(' '),
  )
  return `[${rows.join('; ')}]`
}

/** Parse a pasted block (spreadsheet/tabs/newlines/brackets) into a grid. */
export function parsePastedGrid(text: string): Grid | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Bracket form pastes straight through the canonical parser.
  if (trimmed.startsWith('[')) {
    const grid = parseGrid(trimmed)
    return grid.length && grid[0].length ? grid : null
  }

  const rows = trimmed
    .split(/\r?\n|;/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0)
    .map((row) =>
      row
        .split(/[\t,]+|\s+/)
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0),
    )

  if (rows.length === 0 || rows.some((row) => row.length === 0)) return null
  const cols = Math.max(...rows.map((row) => row.length))
  if (rows.length === 1 && cols === 1) return null // single token: ordinary edit
  return rows.map((row) => {
    const padded = [...row]
    while (padded.length < cols) padded.push('')
    return padded
  })
}

export function dimensions(grid: Grid): { rows: number; cols: number } {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 }
}
