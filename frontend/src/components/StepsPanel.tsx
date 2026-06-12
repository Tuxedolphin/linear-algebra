import { MathTex } from '../lib/math'
import { useCalculatorStore } from '../store/calculator'

export function StepsPanel() {
  const result = useCalculatorStore((state) => state.result)
  const steps = result?.steps ?? []

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">
          Working
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
          {steps.length} step{steps.length === 1 ? '' : 's'}
        </span>
      </div>
      {steps.length ? (
        <ol>
          {steps.map((step) => (
            <li
              key={step.n}
              className="border-b border-softRule py-4 last:border-b-0"
            >
              <div className="flex items-start gap-4">
                <span className="w-7 shrink-0 font-mono text-[11px] font-semibold text-accent">
                  {String(step.n).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="overflow-x-auto text-[13px] text-graphite">
                    <MathTex latex={step.descriptionLatex} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {step.changedRows?.length ? (
                      <div className="font-mono text-[10px] font-semibold text-accent">
                        &gt;R{step.changedRows.map((row) => row + 1).join(', R')}
                      </div>
                    ) : null}
                    {step.matrixLatex ? (
                      <div className="inline-block overflow-x-auto rounded-md bg-surface2 px-4 py-3">
                        <MathTex latex={step.matrixLatex} display />
                      </div>
                    ) : null}
                  </div>
                  {step.changedRows?.length ? (
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                      row {step.changedRows.map((row) => row + 1).join(', ')} changed
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-lg border border-dashed border-rule bg-surface px-4 py-10 text-center text-sm text-graphite">
          Step-by-step workings appear when the operation exposes them.
        </div>
      )}
    </section>
  )
}
