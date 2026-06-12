import { useMemo, useState } from 'react'

import { operations } from '../data/operations'
import { useCalculatorStore } from '../store/calculator'

export function OperationBrowser() {
  const [query, setQuery] = useState('')
  const active = useCalculatorStore((state) => state.operation)
  const setOperation = useCalculatorStore((state) => state.setOperation)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return operations
    return operations.filter((operation) =>
      [operation.label, operation.group, operation.summary, operation.id]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [query])

  return (
    <aside className="flex h-full min-h-0 w-[212px] shrink-0 flex-col border-r border-rule bg-paper">
      <div className="border-b border-rule p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
          MA1522
        </div>
        <h1 className="mt-2 text-xl font-semibold leading-6 text-ink">Linear algebra</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-4 h-9 w-full rounded border border-rule bg-chalk px-3 text-sm text-ink placeholder:text-graphite/55"
          placeholder="Search operation"
          type="search"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {filtered.map((operation) => {
          const isActive = operation.id === active
          return (
            <button
              key={operation.id}
              type="button"
              onClick={() => setOperation(operation.id)}
              className={`w-full border-l-4 px-3 py-3 text-left transition-colors ${
                isActive
                  ? 'border-teal bg-chalk text-ink'
                  : 'border-transparent text-graphite hover:bg-chalk/70'
              }`}
            >
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-brass">
                {operation.group}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-5">
                {operation.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-graphite/75">
                {operation.summary}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
