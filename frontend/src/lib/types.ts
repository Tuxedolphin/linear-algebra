export type OutputMode = 'exact' | 'decimal'

export type MatrixMod = 'none' | 'T' | 'inv' | 'inv_T'

export type ComputeRequest = {
  operation: string
  matrixA: string
  matrixB?: string | null
  matrixC?: string | null
  rhs?: string | null
  k?: number | null
  mods?: {
    m1: MatrixMod
    m2: MatrixMod
    m3: MatrixMod
  } | null
  output: OutputMode
}

export type MatrixBlock = {
  kind: 'matrix'
  label: string
  latex: string
  raw: string
  note?: string | null
}

export type ScalarBlock = {
  kind: 'scalar'
  label: string
  latex: string
}

export type VectorItem = {
  label: string
  latex: string
  raw: string
}

export type VectorListBlock = {
  kind: 'vectorList'
  label: string
  items: VectorItem[]
}

export type ResultBlock = MatrixBlock | ScalarBlock | VectorListBlock

export type Step = {
  n: number
  descriptionLatex: string
  matrixLatex?: string | null
  changedRows?: number[] | null
}

export type ComputeResponse = {
  operation: string
  blocks: ResultBlock[]
  steps: Step[]
}

export type ComputeError = {
  error: {
    code: 'parse' | 'compute' | 'timeout'
    message: string
    cell?: { row: number; col: number } | null
  }
}

export type EquivalentResponse = {
  category: string
  statements: string[]
  properties: {
    rows: number
    cols: number
    rank: number
    nullity: number
  }
}
