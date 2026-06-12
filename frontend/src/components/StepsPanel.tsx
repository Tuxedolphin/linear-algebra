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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="math-scroll min-w-0 text-[13px] text-graphite">
                      <MathTex latex={step.descriptionLatex} />
                    </div>
                    {step.changedRows?.length ? (
                      <span className="rounded-full border border-accentRing bg-accentBg px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                        R{step.changedRows.map((row) => row + 1).join(', R')}
                      </span>
                    ) : null}
                  </div>
                  {step.matrixLatex ? (
                    <div className="math-scroll mt-3 block max-w-full rounded-md bg-surface2 px-4 py-3 text-[0.92rem]">
                      <MathTex latex={step.matrixLatex} display />
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
