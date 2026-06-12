import { useEffect } from 'react'
import { useStore } from 'zustand'

import { useCalculatorStore } from '../store/calculator'

export function ComputeStrip() {
  const isComputing = useCalculatorStore((state) => state.isComputing)
  const runCompute = useCalculatorStore((state) => state.runCompute)

  // Select primitives/stable refs individually — returning a fresh object from
  // a single selector would re-render on every store tick.
  const undo = useStore(useCalculatorStore.temporal, (state) => state.undo)
  const redo = useStore(useCalculatorStore.temporal, (state) => state.redo)
  const canUndo = useStore(useCalculatorStore.temporal, (state) => state.pastStates.length > 0)
  const canRedo = useStore(useCalculatorStore.temporal, (state) => state.futureStates.length > 0)

  // Ctrl/Cmd+Enter runs the active operation from anywhere in the workspace.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void runCompute()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [runCompute])

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-rule bg-panel px-5 py-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => undo()}
          disabled={!canUndo}
          aria-label="Undo"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-rule bg-surface text-base text-graphite hover:bg-surface2 hover:text-ink disabled:opacity-35 disabled:hover:bg-surface"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => redo()}
          disabled={!canRedo}
          aria-label="Redo"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-rule bg-surface text-base text-graphite hover:bg-surface2 hover:text-ink disabled:opacity-35 disabled:hover:bg-surface"
        >
          ↷
        </button>
      </div>
      <button
        type="button"
        onClick={() => void runCompute()}
        disabled={isComputing}
        className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[13px] font-semibold text-white transition-transform active:translate-y-px disabled:cursor-wait disabled:opacity-65"
      >
        {isComputing ? 'Computing…' : 'Compute'}
        <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide">
          ⌘↵
        </kbd>
      </button>
    </div>
  )
}
