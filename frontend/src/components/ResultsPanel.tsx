import { MathTex } from '../lib/math'
import type { MatrixBlock, ResultBlock, VectorListBlock } from '../lib/types'
import { useCalculatorStore } from '../store/calculator'

function MatrixResult({ block }: { block: MatrixBlock }) {
  const sendBlockToMatrixA = useCalculatorStore((state) => state.useBlockAsMatrixA)

  return (
    <article className="rounded-lg border border-rule bg-surface px-4 py-4 shadow-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-[12px] text-graphite">{block.label}</h3>
          {block.note ? <p className="mt-1 text-xs text-graphite">{block.note}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => sendBlockToMatrixA(block.raw)}
          className="shrink-0 rounded border border-rule bg-transparent px-2 py-1 font-mono text-[11px] text-graphite hover:border-accentRing hover:bg-accentBg hover:text-accent"
        >
          {'-> A'}
        </button>
      </div>
      <div className="overflow-x-auto rounded-md bg-surface2 px-3 py-4">
        <MathTex latex={block.latex} display />
      </div>
      <pre className="mt-3 overflow-x-auto rounded border border-rule bg-transparent px-3 py-2 font-mono text-xs text-graphite">
        {block.raw}
      </pre>
    </article>
  )
}

function VectorListResult({ block }: { block: VectorListBlock }) {
  return (
    <article className="rounded-lg border border-rule bg-surface px-4 py-4 shadow-panel">
      <h3 className="font-mono text-[12px] text-graphite">{block.label}</h3>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {block.items.map((item) => (
          <div key={item.label} className="rounded-md bg-surface2 p-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {item.label}
            </div>
            <MathTex latex={item.latex} display className="mt-2 block overflow-x-auto" />
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
    <article className="rounded-lg border border-rule bg-surface px-4 py-4 shadow-panel">
      <h3 className="font-mono text-[12px] text-graphite">{block.label}</h3>
      <div className="mt-3 rounded-md bg-surface2 px-3 py-4">
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite">
          Result
        </h2>
        {result ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite">
            {result.blocks.length} block{result.blocks.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      {error ? (
        <div className="rounded border border-danger/35 bg-dangerBg px-3 py-3 text-sm leading-6 text-danger">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="grid gap-4">
          {result.blocks.map((block, index) => (
            <ResultCard key={`${block.kind}-${block.label}-${index}`} block={block} />
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-lg border border-dashed border-rule bg-surface px-4 py-10 text-center text-sm text-graphite">
          Results appear here after computation.
        </div>
      ) : null}
    </section>
  )
}
