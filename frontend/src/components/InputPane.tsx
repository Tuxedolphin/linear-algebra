import { ComputeStrip } from './ComputeStrip'
import { EquivalentDialog } from './EquivalentDialog'
import { MatrixGrid } from './MatrixGrid'
import type { OperationMeta } from '../data/operations'
import type { MatrixMod } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'

const modOptions: { value: MatrixMod; label: string }[] = [
  { value: 'none', label: 'as-is' },
  { value: 'T', label: 'transpose' },
  { value: 'inv', label: 'inverse' },
  { value: 'inv_T', label: 'inv · transpose' },
]

const modTargets: { key: 'm1' | 'm2' | 'm3'; matrix: string }[] = [
  { key: 'm1', matrix: 'A' },
  { key: 'm2', matrix: 'B' },
  { key: 'm3', matrix: 'C' },
]

export function InputPane({ operation }: { operation: OperationMeta }) {
  const inputs = operation.inputs ?? []
  const matrixA = useCalculatorStore((state) => state.matrixA)
  const matrixB = useCalculatorStore((state) => state.matrixB)
  const matrixC = useCalculatorStore((state) => state.matrixC)
  const rhs = useCalculatorStore((state) => state.rhs)
  const k = useCalculatorStore((state) => state.k)
  const mods = useCalculatorStore((state) => state.mods)
  const setMatrix = useCalculatorStore((state) => state.setMatrix)
  const setK = useCalculatorStore((state) => state.setK)
  const setMod = useCalculatorStore((state) => state.setMod)
  const loadSample = useCalculatorStore((state) => state.loadSample)

  return (
    <section className="flex h-full min-h-0 flex-col border-r border-rule bg-bg">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <header>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-graphite">
            {operation.group}
          </div>
          <h1 className="mt-1.5 text-[21px] font-semibold leading-7 text-ink">
            {operation.label}
          </h1>
          <p className="mt-1 max-w-[52ch] text-[13px] leading-6 text-graphite">
            {operation.summary}
          </p>
        </header>

        <div className="space-y-5">
          <MatrixGrid label="Matrix A" value={matrixA} onChange={(next) => setMatrix('matrixA', next)} />
          {inputs.includes('matrixB') ? (
            <MatrixGrid label="Matrix B" value={matrixB} onChange={(next) => setMatrix('matrixB', next)} />
          ) : null}
          {inputs.includes('matrixC') ? (
            <MatrixGrid label="Matrix C" value={matrixC} onChange={(next) => setMatrix('matrixC', next)} />
          ) : null}
          {inputs.includes('rhs') ? (
            <MatrixGrid
              label="Right-hand side b"
              value={rhs}
              onChange={(next) => setMatrix('rhs', next)}
              singleColumn
            />
          ) : null}
        </div>

        {inputs.includes('k') ? (
          <label className="flex max-w-[240px] items-center justify-between gap-4 text-[13px] font-semibold text-ink">
            Number of steps k
            <input
              value={k}
              onChange={(event) => setK(Number(event.target.value))}
              type="number"
              min={1}
              max={100}
              className="h-8 w-20 rounded border border-rule bg-surface px-3 font-mono text-[13px] text-ink"
            />
          </label>
        ) : null}

        {inputs.includes('mods') ? (
          <fieldset className="space-y-2">
            <legend className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">
              Modifiers
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {modTargets.map(({ key, matrix }) => (
                <label key={key} className="text-[12px] font-medium text-graphite">
                  {matrix}
                  <select
                    value={mods[key]}
                    onChange={(event) => setMod(key, event.target.value as MatrixMod)}
                    className="mt-1 h-8 w-full rounded border border-rule bg-surface px-2 text-[12px] text-ink"
                  >
                    {modOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="space-y-3 border-t border-softRule pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSample}
              className="rounded border border-rule bg-surface px-3 py-1.5 text-[12px] text-graphite hover:bg-surface2 hover:text-ink"
            >
              Load sample
            </button>
            <EquivalentDialog />
          </div>
          <p className="text-[11.5px] leading-5 text-faint">
            Cells accept exact expressions —{' '}
            <code className="rounded bg-surface2 px-1 font-mono text-graphite">sqrt(2)</code>,{' '}
            <code className="rounded bg-surface2 px-1 font-mono text-graphite">pi</code>,{' '}
            <code className="rounded bg-surface2 px-1 font-mono text-graphite">5^(1/3)</code>. Paste a
            block to fill the whole grid.
          </p>
        </div>
      </div>

      <ComputeStrip />
    </section>
  )
}
