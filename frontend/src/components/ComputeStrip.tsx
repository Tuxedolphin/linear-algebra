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
      <div className="shrink-0 border-b border-rule bg-panel">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={runCompute}
                  disabled={isComputing}
                  className="h-[34px] rounded-md bg-accent px-4 text-[13px] font-semibold text-white transition-transform active:translate-y-px disabled:cursor-wait disabled:opacity-65"
                >
                  {isComputing ? 'Computing' : 'Compute'}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content className="rounded bg-ink px-2 py-1 text-xs text-bg">
                Run the selected operation
              </Tooltip.Content>
            </Tooltip.Root>
            <button
              type="button"
              onClick={() => undo()}
              className="h-[34px] rounded-md border border-rule bg-surface px-3 font-mono text-[12px] text-graphite hover:bg-surface2 hover:text-ink"
              aria-label="Undo"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => redo()}
              className="h-[34px] rounded-md border border-rule bg-surface px-3 font-mono text-[12px] text-graphite hover:bg-surface2 hover:text-ink"
              aria-label="Redo"
            >
              Redo
            </button>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase ${
              isComputing ? 'bg-accentBg text-accent' : 'bg-surface2 text-graphite'
            }`}
          >
            {isComputing ? 'running' : 'ready'}
          </span>
        </div>
      </div>
    </Tooltip.Provider>
  )
}
