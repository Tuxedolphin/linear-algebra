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

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof operations>()
    for (const operation of filtered) {
      groups.set(operation.group, [...(groups.get(operation.group) ?? []), operation])
    }
    return [...groups.entries()]
  }, [filtered])

  return (
    <aside className="flex h-full min-h-0 w-[212px] shrink-0 flex-col border-r border-rule bg-panel">
      <div className="border-b border-softRule px-2.5 py-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 w-full rounded-md border border-rule bg-surface px-3 text-[13px] text-ink placeholder:text-faint focus:border-accent"
          placeholder="Search operations...  (/)"
          type="search"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-5 pt-2">
        {grouped.map(([group, groupOperations]) => (
          <div key={group} className="pb-2">
            <div className="px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-graphite">
              {group}
            </div>
            {groupOperations.map((operation) => {
              const isActive = operation.id === active
              return (
                <button
                  key={operation.id}
                  type="button"
                  onClick={() => setOperation(operation.id)}
                  aria-selected={isActive}
                  className={`relative flex h-[31px] w-full items-center gap-2 px-4 text-left text-[12.5px] transition-colors ${
                    isActive
                      ? 'bg-accentBg font-medium text-accent'
                      : 'text-graphite hover:bg-surface2 hover:text-ink'
                  }`}
                >
                  {isActive ? (
                    <span className="absolute left-0 h-4 w-[3px] rounded-r bg-accent" />
                  ) : null}
                  <span className="truncate">{operation.label}</span>
                  <span className="ml-auto h-1 w-1 rounded-full bg-faint opacity-70" />
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}
