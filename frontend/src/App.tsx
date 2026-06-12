import { useEffect, useMemo, useState } from 'react'
import * as Switch from '@radix-ui/react-switch'

import { HistoryDrawer } from './components/HistoryDrawer'
import { InputPane } from './components/InputPane'
import { OperationBrowser } from './components/OperationBrowser'
import { ResultsPanel } from './components/ResultsPanel'
import { StepsPanel } from './components/StepsPanel'
import { operations } from './data/operations'
import { useCalculatorStore } from './store/calculator'

function App() {
  const operationId = useCalculatorStore((state) => state.operation)
  const theme = useCalculatorStore((state) => state.theme)
  const setTheme = useCalculatorStore((state) => state.setTheme)
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
    <main className="flex h-[100dvh] min-w-[1100px] flex-col overflow-hidden bg-bg text-ink">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-rule bg-panel px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-accent font-mono text-[13px] font-semibold text-white">
            Σ
          </div>
          <span className="text-[15px] font-bold leading-none text-ink">MA1522</span>
          <span className="rounded border border-accentRing px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
            Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HistoryDrawer />
          <label className="flex h-[30px] items-center gap-2.5 rounded-md border border-rule bg-surface px-2.5">
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
          </label>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(390px,440px)_minmax(0,1fr)]">
        <OperationBrowser />
        <InputPane operation={operation} />
        <div className="min-h-0 overflow-y-auto bg-bg px-6 py-6">
          <div className="mx-auto max-w-[920px] space-y-8">
            <ResultsPanel />
            <StepsPanel />
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
