import type { OutputMode } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'

const modes: { value: OutputMode; label: string; hint: string }[] = [
  { value: 'exact', label: 'a/b', hint: 'Exact' },
  { value: 'decimal', label: '0.5', hint: 'Decimal' },
]

export function OutputToggle() {
  const output = useCalculatorStore((state) => state.output)
  const setOutput = useCalculatorStore((state) => state.setOutput)

  return (
    <div role="group" aria-label="Result format" className="flex overflow-hidden rounded-md border border-rule bg-surface">
      {modes.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => setOutput(mode.value)}
          aria-pressed={output === mode.value}
          title={`${mode.hint} values`}
          className={`min-w-[44px] border-r border-softRule px-2.5 py-1 font-mono text-[11px] font-medium last:border-r-0 ${
            output === mode.value ? 'bg-accentBg text-accent' : 'text-graphite hover:text-ink'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
