import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type MathProps = {
  latex: string
  display?: boolean
  className?: string
}

export function MathTex({ latex, display = false, className }: MathProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
      }),
    [latex, display],
  )

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function InlineStatement({ source }: { source: string }) {
  const parts: Array<{ kind: 'text' | 'math'; value: string }> = []
  const pattern = /\\\((.*?)\\\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(source))) {
    if (match.index > lastIndex) {
      parts.push({ kind: 'text', value: source.slice(lastIndex, match.index) })
    }
    parts.push({ kind: 'math', value: match[1] })
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < source.length) {
    parts.push({ kind: 'text', value: source.slice(lastIndex) })
  }

  if (!parts.length) return <span>{source}</span>

  return (
    <>
      {parts.map((part, index) =>
        part.kind === 'math' ? (
          <MathTex key={`${part.value}-${index}`} latex={part.value} />
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </>
  )
}
