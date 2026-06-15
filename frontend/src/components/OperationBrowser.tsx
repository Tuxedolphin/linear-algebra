import { useEffect, useMemo, useRef, useState } from 'react'

import { operations } from '../data/operations'
import { useCalculatorStore } from '../store/calculator'

export function OperationBrowser() {
  const [query, setQuery] = useState('')
  const active = useCalculatorStore((state) => state.operation)
  const setOperation = useCalculatorStore((state) => state.setOperation)
  const searchRef = useRef<HTMLInputElement>(null)

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
      const groupOperations = groups.get(operation.group)
      if (groupOperations) {
        groupOperations.push(operation)
      } else {
        groups.set(operation.group, [operation])
      }
    }
    return [...groups.entries()]
  }, [filtered])
  const activeInFiltered = filtered.some((operation) => operation.id === active)

  // `/` from anywhere focuses search (unless already typing in a field).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function selectAndReveal(id: string) {
    setOperation(id)
    requestAnimationFrame(() =>
      document.getElementById(`op-${id}`)?.scrollIntoView({ block: 'nearest' }),
    )
  }

  function moveSelection(delta: number) {
    if (filtered.length === 0) return
    const index = filtered.findIndex((operation) => operation.id === active)
    const current = index < 0 ? (delta > 0 ? -1 : filtered.length) : index
    const next = Math.min(filtered.length - 1, Math.max(0, current + delta))
    selectAndReveal(filtered[next].id)
  }

  function handleListKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveSelection(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveSelection(-1)
        break
      case 'Home':
        event.preventDefault()
        if (filtered[0]) selectAndReveal(filtered[0].id)
        break
      case 'End':
        event.preventDefault()
        if (filtered.length) selectAndReveal(filtered[filtered.length - 1].id)
        break
    }
  }

  return (
    <aside className="flex w-full flex-col border-b border-rule bg-panel lg:h-full lg:min-h-0 lg:w-[220px] lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="border-b border-softRule p-2.5">
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-8 w-full rounded-md border border-rule bg-surface px-3 text-[13px] text-ink placeholder:text-faint focus:border-accent"
          placeholder="Search operations…  /"
          type="search"
          aria-label="Search operations"
        />
      </div>
      <ul
        role="listbox"
        aria-label="Operations"
        aria-activedescendant={activeInFiltered ? `op-${active}` : undefined}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        className="max-h-[40vh] min-h-0 flex-1 overflow-y-auto pb-5 pt-1 lg:max-h-none"
      >
        {grouped.length === 0 ? (
          <li className="px-4 py-6 text-center text-[12px] text-faint">No matches</li>
        ) : null}
        {grouped.map(([group, groupOperations]) => (
          <li key={group} role="group" aria-label={group}>
            <div
              aria-hidden
              className="px-3 pb-1 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-faint"
            >
              {group}
            </div>
            <ul role="presentation">
              {groupOperations.map((operation) => {
                const isActive = operation.id === active
                return (
                  <li
                    key={operation.id}
                    id={`op-${operation.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => setOperation(operation.id)}
                    className={`relative flex min-h-[34px] cursor-pointer items-center px-4 text-[12.5px] transition-colors active:bg-surface2 lg:min-h-[30px] ${
                      isActive
                        ? 'bg-accentBg font-medium text-ink'
                        : 'text-graphite hover:bg-surface2 hover:text-ink'
                    }`}
                  >
                    {isActive ? (
                      <span aria-hidden className="absolute left-0 h-4 w-[2.5px] rounded-r bg-accent" />
                    ) : null}
                    <span className="truncate">{operation.label}</span>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  )
}
