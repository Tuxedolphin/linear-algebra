import type { MatrixMod } from '../lib/types'
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
  minRows = 6,
}: {
  id: MatrixKey
  label: string
  value: string
  onChange: (key: MatrixKey, value: string) => void
  minRows?: number
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">
        <span className="block">{label}</span>
        <span className="mt-1 block font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-graphite/65">
          rows separated by semicolons
        </span>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        rows={minRows}
        spellCheck={false}
        className="w-full resize-none rounded border border-rule bg-paper px-3 py-3 font-mono text-sm leading-6 text-ink shadow-sm placeholder:text-graphite/45"
        placeholder="[1 2; 3 4]"
      />
    </label>
  )
}

export function MatrixInputs({ requiredInputs }: { requiredInputs: string[] }) {
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
    <section className="rounded border border-rule bg-chalk p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Inputs</h2>
          <p className="mt-1 text-sm leading-6 text-graphite">
            Accepts bracket, semicolon, or LaTeX matrix notation.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSample}
          className="h-9 whitespace-nowrap rounded border border-rule bg-paper px-3 text-sm font-semibold text-graphite hover:text-ink"
        >
          Load sample
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
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
        <label className="mt-4 flex max-w-xs items-center justify-between gap-4 text-sm font-semibold text-ink">
          Steps k
          <input
            value={k}
            onChange={(event) => setK(Number(event.target.value))}
            type="number"
            min={1}
            max={100}
            className="h-9 w-24 rounded border border-rule bg-paper px-3 font-mono text-sm"
          />
        </label>
      ) : null}

      {requiredInputs.includes('mods') ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['m1', 'm2', 'm3'] as const).map((key, index) => (
            <label key={key} className="text-sm font-semibold text-ink">
              Modifier {index + 1}
              <select
                value={mods[key]}
                onChange={(event) => setMod(key, event.target.value as MatrixMod)}
                className="mt-2 h-9 w-full rounded border border-rule bg-paper px-2 text-sm"
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
    </section>
  )
}
