import { MathTex } from '../lib/math'
import { useCalculatorStore } from '../store/calculator'

export function StepsPanel() {
  const result = useCalculatorStore((state) => state.result)
  const steps = result?.steps ?? []

  return (
    <section className="rounded border border-rule bg-chalk p-4 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Working</h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
          {steps.length} step{steps.length === 1 ? '' : 's'}
        </span>
      </div>
      {steps.length ? (
        <ol className="grid gap-3">
          {steps.map((step) => (
            <li key={step.n} className="rounded border border-rule bg-paper p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs text-paper">
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="overflow-x-auto text-sm">
                    <MathTex latex={step.descriptionLatex} />
                  </div>
                  {step.changedRows?.length ? (
                    <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-teal">
                      row {step.changedRows.map((row) => row + 1).join(', ')} changed
                    </div>
                  ) : null}
                  {step.matrixLatex ? (
                    <div className="mt-3 overflow-x-auto rounded bg-chalk px-3 py-4">
                      <MathTex latex={step.matrixLatex} display />
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded border border-dashed border-rule bg-paper px-4 py-10 text-center text-sm text-graphite">
          Step-by-step workings appear when the operation exposes them.
        </div>
      )}
    </section>
  )
}
