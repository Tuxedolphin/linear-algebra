import { useState } from 'react'

import { MathTex } from '../lib/math'
import { OutputToggle } from './OutputToggle'
import type { MatrixBlock, ResultBlock, VectorListBlock } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => {})
      }}
      className="rounded border border-rule bg-surface px-2 py-1 font-mono text-[11px] text-graphite hover:border-accentRing hover:text-accent"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function MatrixResult({ block }: { block: MatrixBlock }) {
  const sendBlockToMatrixA = useCalculatorStore((state) => state.useBlockAsMatrixA)
  const [loaded, setLoaded] = useState(false)

  return (
    <article className="rounded-lg border border-rule bg-surface p-4 shadow-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[12px] font-medium text-ink">{block.label}</h3>
          {block.note ? <p className="mt-1 text-xs leading-5 text-graphite">{block.note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <CopyButton text={block.raw} />
          <button
            type="button"
            onClick={() => {
              sendBlockToMatrixA(block.raw)
              setLoaded(true)
              window.setTimeout(() => setLoaded(false), 1800)
            }}
            className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
              loaded
                ? 'border-ok bg-okBg text-ok'
                : 'border-rule bg-surface text-graphite hover:border-accentRing hover:text-accent'
            }`}
          >
            {loaded ? '✓ Loaded' : '→ A'}
          </button>
        </div>
      </div>
      <div className="math-scroll rounded-md bg-surface2 px-3 py-4">
        <MathTex latex={block.latex} display />
      </div>
    </article>
  )
}

function VectorListResult({ block }: { block: VectorListBlock }) {
  return (
    <article className="rounded-lg border border-rule bg-surface p-4 shadow-panel">
      <h3 className="font-mono text-[12px] font-medium text-ink">{block.label}</h3>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-md bg-surface2 p-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {item.label}
            </div>
            <MathTex latex={item.latex} display className="math-scroll mt-2 block" />
          </div>
        ))}
      </div>
    </article>
  )
}

function ResultCard({ block }: { block: ResultBlock }) {
  if (block.kind === 'matrix') return <MatrixResult block={block} />
  if (block.kind === 'vectorList') return <VectorListResult block={block} />
  return (
    <article className="rounded-lg border border-rule bg-surface p-4 shadow-panel">
      <h3 className="font-mono text-[12px] font-medium text-ink">{block.label}</h3>
      <div className="math-scroll mt-3 rounded-md bg-surface2 px-3 py-4">
        <MathTex latex={block.latex} display />
      </div>
    </article>
  )
}

export function ResultsPanel() {
  const result = useCalculatorStore((state) => state.result)
  const error = useCalculatorStore((state) => state.error)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">
          Result
        </h2>
        <OutputToggle />
      </div>
      {error ? (
        <div className="rounded-lg border border-danger/35 bg-dangerBg px-4 py-3 text-sm leading-6 text-danger">
          {error}
        </div>
      ) : result ? (
        <div className="grid gap-4">
          {result.blocks.map((block, index) => (
            <ResultCard key={`${block.kind}-${block.label}-${index}`} block={block} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-rule bg-surface px-4 py-12 text-center">
          <div className="font-mono text-[22px] text-faint">[ ]</div>
          <p className="text-sm text-graphite">Enter a matrix and press Compute.</p>
          <p className="font-mono text-[11px] text-faint">⌘↵ runs the operation</p>
        </div>
      )}
    </section>
  )
}
