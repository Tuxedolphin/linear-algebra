import { useEffect, useMemo, useState } from 'react'
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
  const output = useCalculatorStore((state) => state.output)
  const setOutput = useCalculatorStore((state) => state.setOutput)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const operation = useMemo(
    () => operations.find((item) => item.id === operationId) ?? operations[0],
    [operationId],
  )

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      const next = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      root.dataset.theme = next
      setResolvedTheme(next)
    }

    applyTheme()
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  return (
    <main className="flex h-[100dvh] min-w-[1120px] flex-col overflow-hidden bg-bg text-ink">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-panel px-3">
        <div className="flex h-full items-center">
          <div className="flex h-full items-center gap-2 border-r border-rule pr-4">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-accent font-mono text-[13px] font-semibold text-white">
              Σ
            </div>
            <div className="text-[15px] font-bold leading-none text-ink">MA1522</div>
            <div className="rounded border border-accentRing px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
              Studio
            </div>
          </div>
          <nav className="ml-3 flex items-center gap-1" aria-label="Workspace views">
            <button className="rounded-md bg-accentBg px-3 py-1.5 text-[13px] font-medium text-accent">
              Compute
            </button>
            <button className="rounded-md px-3 py-1.5 text-[13px] font-medium text-graphite hover:bg-surface2 hover:text-ink">
              History
            </button>
            <EquivalentDialog variant="tab" />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-[30px] overflow-hidden rounded-md border border-rule bg-surface">
            {(['exact', 'decimal'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setOutput(mode)}
                className={`min-w-[46px] border-r border-softRule px-3 font-mono text-[10.5px] font-medium last:border-r-0 ${
                  output === mode ? 'bg-accentBg text-accent' : 'text-graphite'
                }`}
              >
                {mode === 'exact' ? 'a/b' : '0.5'}
              </button>
            ))}
          </div>
          <div className="flex h-[30px] items-center gap-2 rounded-md border border-rule bg-surface px-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite">
              {resolvedTheme}
            </span>
            <Switch.Root
              checked={resolvedTheme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              className="relative h-4 w-8 rounded-full bg-surface2 data-[state=checked]:bg-accentBg"
              aria-label="Toggle light and dark theme"
            >
              <Switch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-faint transition-transform data-[state=checked]:translate-x-[17px] data-[state=checked]:bg-accent" />
            </Switch.Root>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[212px_minmax(0,1fr)]">
        <OperationBrowser />
        <section className="flex min-w-0 flex-col overflow-hidden bg-bg">
          <MatrixInputs requiredInputs={operation.inputs ?? []} operation={operation} />
          <ComputeStrip />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mx-auto grid max-w-[1180px] gap-5">
              <ResultsPanel />
              <StepsPanel />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
