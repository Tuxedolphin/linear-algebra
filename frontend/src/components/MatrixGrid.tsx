import { useEffect, useRef, useState } from 'react'

import {
  dimensions,
  parseGrid,
  parsePastedGrid,
  serializeGrid,
  type Grid,
} from '../lib/matrix'

type MatrixGridProps = {
  label: string
  value: string
  onChange: (next: string) => void
  /** Lock to a single column (right-hand side / vectors). */
  singleColumn?: boolean
}

const MAX_ROWS = 8
const MAX_COLS = 8

export function MatrixGrid({ label, value, onChange, singleColumn = false }: MatrixGridProps) {
  const [grid, setGrid] = useState<Grid>(() => parseGrid(value))
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Re-sync from the store when the value changes externally (sample load,
  // chaining, undo/redo). Compare normalised forms to avoid whitespace loops.
  useEffect(() => {
    setGrid((current) => {
      const next = parseGrid(value)
      return serializeGrid(current) === serializeGrid(next) ? current : next
    })
  }, [value])

  const { rows, cols } = dimensions(grid)

  function commit(next: Grid) {
    setGrid(next)
    onChange(serializeGrid(next))
  }

  function setCell(r: number, c: number, cellValue: string) {
    commit(grid.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? cellValue : cell))))
  }

  function focusCell(r: number, c: number) {
    cellRefs.current[`${r}-${c}`]?.focus()
    cellRefs.current[`${r}-${c}`]?.select()
  }

  function resizeRows(delta: number) {
    const nextRows = Math.min(MAX_ROWS, Math.max(1, rows + delta))
    if (nextRows === rows) return
    if (nextRows > rows) {
      commit([...grid, Array.from({ length: cols }, () => '')])
    } else {
      commit(grid.slice(0, nextRows))
    }
  }

  function resizeCols(delta: number) {
    const nextCols = Math.min(MAX_COLS, Math.max(1, cols + delta))
    if (nextCols === cols) return
    commit(
      grid.map((row) =>
        nextCols > cols ? [...row, ''] : row.slice(0, nextCols),
      ),
    )
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    const input = event.currentTarget
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0
    const atEnd =
      input.selectionStart === input.value.length && input.selectionEnd === input.value.length

    switch (event.key) {
      case 'ArrowUp':
        if (r > 0) {
          event.preventDefault()
          focusCell(r - 1, c)
        }
        break
      case 'ArrowDown':
      case 'Enter':
        if (r < rows - 1) {
          event.preventDefault()
          focusCell(r + 1, c)
        }
        break
      case 'ArrowLeft':
        if (atStart && c > 0) {
          event.preventDefault()
          focusCell(r, c - 1)
        }
        break
      case 'ArrowRight':
        if (atEnd && c < cols - 1) {
          event.preventDefault()
          focusCell(r, c + 1)
        }
        break
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = parsePastedGrid(event.clipboardData.getData('text'))
    if (!pasted) return // single value: let the normal paste happen
    event.preventDefault()
    const next = singleColumn ? pasted.map((row) => [row[0] ?? '']) : pasted
    commit(next)
    requestAnimationFrame(() => focusCell(0, 0))
  }

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">
          <Stepper
            label="rows"
            value={rows}
            onDecrement={() => resizeRows(-1)}
            onIncrement={() => resizeRows(1)}
            min={rows <= 1}
            max={rows >= MAX_ROWS}
          />
          {!singleColumn ? (
            <Stepper
              label="cols"
              value={cols}
              onDecrement={() => resizeCols(-1)}
              onIncrement={() => resizeCols(1)}
              min={cols <= 1}
              max={cols >= MAX_COLS}
            />
          ) : null}
        </div>
      </div>

      <div className="inline-flex items-stretch gap-2">
        <span aria-hidden className="w-[6px] rounded-l-[3px] border-y border-l border-rule" />
        <div
          role="group"
          aria-label={`${label} cells`}
          className="grid gap-1 py-1"
          style={{ gridTemplateColumns: `repeat(${cols}, 52px)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                ref={(node) => {
                  cellRefs.current[`${r}-${c}`] = node
                }}
                value={cell}
                inputMode="text"
                spellCheck={false}
                aria-label={`${label} row ${r + 1} column ${c + 1}`}
                onChange={(event) => setCell(r, c, event.target.value)}
                onFocus={(event) => event.target.select()}
                onKeyDown={(event) => handleKeyDown(event, r, c)}
                onPaste={handlePaste}
                className="h-8 w-full rounded-[5px] border border-rule bg-surface text-center font-mono text-[13px] text-ink transition-colors hover:border-accentRing focus:border-accent"
              />
            )),
          )}
        </div>
        <span aria-hidden className="w-[6px] rounded-r-[3px] border-y border-r border-rule" />
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  min,
  max,
}: {
  label: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  min: boolean
  max: boolean
}) {
  return (
    <span className="flex items-center gap-1">
      <span>{label}</span>
      <span className="flex items-center overflow-hidden rounded border border-rule bg-surface">
        <button
          type="button"
          onClick={onDecrement}
          disabled={min}
          aria-label={`Remove ${label.replace(/s$/, '')}`}
          className="h-6 w-6 text-ink transition-transform hover:bg-surface2 active:translate-y-px disabled:opacity-30 disabled:active:translate-y-0"
        >
          −
        </button>
        <span className="w-5 text-center text-[11px] text-ink">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={max}
          aria-label={`Add ${label.replace(/s$/, '')}`}
          className="h-6 w-6 text-ink transition-transform hover:bg-surface2 active:translate-y-px disabled:opacity-30 disabled:active:translate-y-0"
        >
          +
        </button>
      </span>
    </span>
  )
}
