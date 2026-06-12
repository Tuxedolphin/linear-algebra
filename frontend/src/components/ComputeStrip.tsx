import * as Tooltip from '@radix-ui/react-tooltip'

import { compute } from '../lib/api'
import { useCalculatorStore } from '../store/calculator'

export function ComputeStrip() {
  const {
    operation,
    matrixA,
    matrixB,
    matrixC,
    rhs,
    k,
    mods,
    output,
    isComputing,
    setComputing,
    setError,
    setResult,
    setOutput,
  } = useCalculatorStore()
  const undo = useCalculatorStore.temporal.getState().undo
  const redo = useCalculatorStore.temporal.getState().redo

  async function runCompute() {
    setComputing(true)
    setError(null)
    try {
      const response = await compute({
        operation,
        matrixA,
        matrixB: matrixB.trim() ? matrixB : null,
        matrixC: matrixC.trim() ? matrixC : null,
        rhs: rhs.trim() ? rhs : null,
        k,
        mods,
        output,
      })
      setResult(response)
    } catch (error) {
      setResult(null)
      setError(error instanceof Error ? error.message : 'Computation failed.')
    } finally {
      setComputing(false)
    }
  }

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-rule bg-chalk/95 px-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                onClick={runCompute}
                disabled={isComputing}
                className="h-9 rounded bg-teal px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-65"
              >
                {isComputing ? 'Computing' : 'Compute'}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content className="rounded bg-ink px-2 py-1 text-xs text-paper">
              Run the selected operation
            </Tooltip.Content>
          </Tooltip.Root>
          <button
            type="button"
            onClick={() => undo()}
            className="h-9 w-9 rounded border border-rule bg-paper font-mono text-sm text-graphite hover:text-ink"
            aria-label="Undo"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => redo()}
            className="h-9 w-9 rounded border border-rule bg-paper font-mono text-sm text-graphite hover:text-ink"
            aria-label="Redo"
          >
            ↪
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded border border-rule bg-paper p-1 text-sm">
            {(['exact', 'decimal'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setOutput(mode)}
                className={`h-7 rounded px-3 font-semibold capitalize ${
                  output === mode ? 'bg-ink text-paper' : 'text-graphite'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <span className="rounded-full border border-rule bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
            {isComputing ? 'running' : 'ready'}
          </span>
        </div>
      </div>
    </Tooltip.Provider>
  )
}
