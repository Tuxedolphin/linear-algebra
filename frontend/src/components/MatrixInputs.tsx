import type { MatrixMod } from '../lib/types'
import type { OperationMeta } from '../data/operations'
import { useCalculatorStore } from '../store/calculator'

type MatrixKey = 'matrixA' | 'matrixB' | 'matrixC' | 'rhs'

const modOptions: { value: MatrixMod; label: string }[] = [
  { value: 'none', label: 'A' },
  { value: 'T', label: 'A^T' },
  { value: 'inv', label: 'A^-1' },
  { value: 'inv_T', label: '(A^-1)^T' },
]

function MatrixField({
  id,
  label,
  value,
  onChange,
  minRows = 4,
}: {
  id: MatrixKey
  label: string
  value: string
  onChange: (key: MatrixKey, value: string) => void
  minRows?: number
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-ink">
        <span className="block uppercase tracking-[0.02em]">{label}</span>
        <span className="mt-1 block font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-graphite">
          rows separated by semicolons
        </span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        rows={minRows}
        spellCheck={false}
        className="w-full resize-none rounded border border-rule bg-surface px-3 py-3 font-mono text-[13px] leading-6 text-ink placeholder:text-faint focus:border-accent"
        placeholder="[1 2; 3 4]"
      />
    </label>
  )
}

export function MatrixInputs({
  requiredInputs,
  operation,
}: {
  requiredInputs: string[]
  operation: OperationMeta
}) {
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
    <section className="shrink-0 border-b border-softRule px-5 py-[18px]">
      <div className="mx-auto max-w-[1180px]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">
            Matrix A
          </div>
          <h1 className="mt-2 text-[22px] font-semibold leading-7 text-ink">
            {operation.label}
          </h1>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-6 text-graphite">
            {operation.summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {['3x3', '3x4', '4x4', 'n×n'].map((size, index) => (
            <button
              key={size}
              type="button"
              className={`h-6 rounded border px-2 font-mono text-[10px] ${
                index === 0
                  ? 'border-accentRing bg-accentBg text-accent'
                  : 'border-rule text-graphite hover:bg-surface2 hover:text-ink'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="grid max-w-[760px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <MatrixField id="matrixA" label="Matrix A" value={matrixA} onChange={setMatrix} />
        {requiredInputs.includes('matrixB') ? (
          <MatrixField id="matrixB" label="Matrix B" value={matrixB} onChange={setMatrix} />
        ) : null}
        {requiredInputs.includes('matrixC') ? (
          <MatrixField id="matrixC" label="Matrix C" value={matrixC} onChange={setMatrix} />
        ) : null}
        {requiredInputs.includes('rhs') ? (
          <MatrixField id="rhs" label="Right-hand side / vector" value={rhs} onChange={setMatrix} />
        ) : null}
      </div>

      {requiredInputs.includes('k') ? (
        <label className="mt-4 flex max-w-xs items-center justify-between gap-4 text-[13px] font-semibold text-ink">
          Steps k
          <input
            value={k}
            onChange={(event) => setK(Number(event.target.value))}
            type="number"
            min={1}
            max={100}
            className="h-8 w-24 rounded border border-rule bg-surface px-3 font-mono text-[13px]"
          />
        </label>
      ) : null}

      {requiredInputs.includes('mods') ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['m1', 'm2', 'm3'] as const).map((key, index) => (
            <label key={key} className="text-[13px] font-semibold text-ink">
              Modifier {index + 1}
              <select
                value={mods[key]}
                onChange={(event) => setMod(key, event.target.value as MatrixMod)}
                className="mt-2 h-8 w-full rounded border border-rule bg-surface px-2 text-[13px]"
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
      ) : null}
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-graphite">
        <button
          type="button"
          onClick={loadSample}
          className="rounded border border-rule px-3 py-1.5 text-[12px] text-graphite hover:bg-surface2 hover:text-ink"
        >
          Random
        </button>
        <span>
          Cells accept exact algebra and constants, e.g. <code className="rounded bg-surface2 px-1 font-mono text-ink">sqrt(2)</code>, <code className="rounded bg-surface2 px-1 font-mono text-ink">pi</code>, <code className="rounded bg-surface2 px-1 font-mono text-ink">5^(1/3)</code>.
        </span>
      </div>
      </div>
    </section>
  )
}
