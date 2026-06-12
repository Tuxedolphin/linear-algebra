import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import { useCalculatorStore } from '../store/calculator'

function relativeTime(ts: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function HistoryDrawer() {
  const [open, setOpen] = useState(false)
  const history = useCalculatorStore((state) => state.history)
  const restore = useCalculatorStore((state) => state.restoreFromHistory)
  const clearHistory = useCalculatorStore((state) => state.clearHistory)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-[30px] items-center gap-1.5 rounded-md border border-rule bg-surface px-3 text-[13px] font-medium text-graphite hover:bg-surface2 hover:text-ink"
        >
          History
          {history.length ? (
            <span className="rounded-full bg-accentBg px-1.5 font-mono text-[10px] font-semibold text-accent">
              {history.length}
            </span>
          ) : null}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-rule bg-panel shadow-panel animate-[slideInRight_180ms_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
            <Dialog.Title className="text-[15px] font-semibold text-ink">History</Dialog.Title>
            <div className="flex items-center gap-2">
              {history.length ? (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="rounded border border-rule bg-surface px-2 py-1 font-mono text-[11px] text-graphite hover:border-danger/40 hover:text-danger"
                >
                  Clear
                </button>
              ) : null}
              <Dialog.Close
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-rule bg-surface text-xl leading-none text-graphite hover:bg-surface2 hover:text-ink"
              >
                ×
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">
            Previously computed operations. Select one to restore its inputs and result.
          </Dialog.Description>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {history.length === 0 ? (
              <div className="mt-10 px-4 text-center text-sm text-graphite">
                <div className="font-mono text-[22px] text-faint">⟲</div>
                <p className="mt-2">Computed operations show up here.</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => {
                        restore(entry.id)
                        setOpen(false)
                      }}
                      className="w-full rounded-md border border-rule bg-surface px-3 py-2.5 text-left hover:border-accentRing hover:bg-accentBg"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-ink">
                          {entry.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                          {relativeTime(entry.ts)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-surface2 px-1.5 font-mono text-[10px] text-graphite">
                          {entry.output === 'exact' ? 'a/b' : '0.5'}
                        </span>
                        <span className="truncate font-mono text-[11px] text-graphite">
                          {entry.matrixA}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
