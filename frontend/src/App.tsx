import { useEffect, useMemo } from 'react'
import * as Switch from '@radix-ui/react-switch'

import { ComputeStrip } from './components/ComputeStrip'
import { EquivalentDialog } from './components/EquivalentDialog'
import { MatrixInputs } from './components/MatrixInputs'
import { OperationBrowser } from './components/OperationBrowser'
import { ResultsPanel } from './components/ResultsPanel'
import { StepsPanel } from './components/StepsPanel'
import { operations } from './data/operations'
import { useCalculatorStore } from './store/calculator'

function App() {
  const operationId = useCalculatorStore((state) => state.operation)
  const theme = useCalculatorStore((state) => state.theme)
  const setTheme = useCalculatorStore((state) => state.setTheme)
  const operation = useMemo(
    () => operations.find((item) => item.id === operationId) ?? operations[0],
    [operationId],
  )

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
    root.dataset.theme = resolved
  }, [theme])

  return (
    <main className="h-screen min-w-[1120px] overflow-hidden bg-chalk text-ink">
      <div className="grid h-full grid-cols-[212px_minmax(0,1fr)]">
        <OperationBrowser />
        <section className="min-w-0">
          <ComputeStrip />
          <div className="flex h-[calc(100vh-56px)] min-h-0 flex-col overflow-hidden">
            <header className="border-b border-rule bg-paper px-5 py-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
                    {operation.group}
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold leading-8 text-ink">
                    {operation.label}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-graphite">
                    {operation.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <EquivalentDialog />
                  <div className="flex items-center gap-2 rounded border border-rule bg-chalk px-3 py-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
                      Dark
                    </span>
                    <Switch.Root
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      className="relative h-5 w-9 rounded-full bg-rule data-[state=checked]:bg-teal"
                      aria-label="Toggle dark theme"
                    >
                      <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-paper transition-transform data-[state=checked]:translate-x-[18px]" />
                    </Switch.Root>
                  </div>
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] gap-5">
                <div className="grid content-start gap-5">
                  <MatrixInputs requiredInputs={operation.inputs ?? []} />
                  <ResultsPanel />
                </div>
                <StepsPanel />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
