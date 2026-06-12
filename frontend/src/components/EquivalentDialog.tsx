import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import { equivalent } from '../lib/api'
import { InlineStatement } from '../lib/math'
import type { EquivalentResponse } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'

export function EquivalentDialog({ variant = 'button' }: { variant?: 'button' | 'tab' }) {
  const matrixA = useCalculatorStore((state) => state.matrixA)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<EquivalentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  async function loadEquivalent(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen || data || isLoading) return
    setLoading(true)
    setError(null)
    try {
      setData(await equivalent(matrixA))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load equivalent statements.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={loadEquivalent}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={
            variant === 'tab'
              ? 'rounded-md px-3 py-1.5 text-[13px] font-medium text-graphite hover:bg-surface2 hover:text-ink'
              : 'h-8 rounded-md border border-rule bg-surface px-3 text-[13px] font-medium text-graphite hover:bg-surface2 hover:text-ink'
          }
        >
          {variant === 'tab' ? 'Equiv. Statements' : 'Equivalent statements'}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[82vh] w-[min(760px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-rule bg-panel shadow-panel">
          <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-ink">
                Equivalent statements
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-graphite">
                {data?.category ?? 'Computed from Matrix A'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="h-8 w-8 rounded-md border border-rule bg-surface text-lg leading-none text-graphite hover:bg-surface2 hover:text-ink">
              x
            </Dialog.Close>
          </div>
          <div className="max-h-[66vh] overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="rounded border border-rule bg-surface p-4 text-sm text-graphite">
                Loading statements.
              </div>
            ) : null}
            {error ? (
              <div className="rounded border border-danger/35 bg-dangerBg p-4 text-sm text-danger">
                {error}
              </div>
            ) : null}
            {data ? (
              <>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {Object.entries(data.properties).map(([key, value]) => (
                    <div key={key} className="rounded border border-rule bg-surface p-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
                        {key}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
                    </div>
                  ))}
                </div>
                <ol className="grid gap-2">
                  {data.statements.map((statement, index) => (
                    <li
                      key={`${statement}-${index}`}
                      className="rounded border border-rule bg-surface px-3 py-3 text-sm leading-6 text-ink"
                    >
                      <InlineStatement source={statement} />
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
