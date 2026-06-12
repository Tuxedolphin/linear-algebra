import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'

import { defaultOperation, operations } from '../data/operations'
import type { ComputeResponse, MatrixMod, OutputMode } from '../lib/types'

type ThemeMode = 'system' | 'light' | 'dark'

type TrackedState = Pick<
  CalculatorState,
  | 'operation'
  | 'matrixA'
  | 'matrixB'
  | 'matrixC'
  | 'rhs'
  | 'k'
  | 'mods'
  | 'output'
>

export type CalculatorState = {
  operation: string
  matrixA: string
  matrixB: string
  matrixC: string
  rhs: string
  k: number
  mods: { m1: MatrixMod; m2: MatrixMod; m3: MatrixMod }
  output: OutputMode
  theme: ThemeMode
  result: ComputeResponse | null
  error: string | null
  isComputing: boolean
  setOperation: (operation: string) => void
  setMatrix: (key: 'matrixA' | 'matrixB' | 'matrixC' | 'rhs', value: string) => void
  setK: (value: number) => void
  setMod: (key: 'm1' | 'm2' | 'm3', value: MatrixMod) => void
  setOutput: (output: OutputMode) => void
  setTheme: (theme: ThemeMode) => void
  setResult: (result: ComputeResponse | null) => void
  setError: (error: string | null) => void
  setComputing: (isComputing: boolean) => void
  loadSample: () => void
  useBlockAsMatrixA: (raw: string) => void
}

const initialOperation = defaultOperation.id

export const useCalculatorStore = create<CalculatorState>()(
  temporal(
    persist(
      (set, get) => ({
        operation: initialOperation,
        matrixA: defaultOperation.sampleA ?? '[1 2; 3 4]',
        matrixB: '',
        matrixC: '',
        rhs: '',
        k: 2,
        mods: { m1: 'none', m2: 'none', m3: 'none' },
        output: 'exact',
        theme: 'system',
        result: null,
        error: null,
        isComputing: false,
        setOperation: (operation) => {
          const meta = operations.find((item) => item.id === operation)
          set({
            operation,
            matrixA: meta?.sampleA ?? get().matrixA,
            matrixB: meta?.sampleB ?? '',
            matrixC: meta?.sampleC ?? '',
            rhs: meta?.sampleRhs ?? '',
            result: null,
            error: null,
          })
        },
        setMatrix: (key, value) => set({ [key]: value, error: null }),
        setK: (k) => set({ k, error: null }),
        setMod: (key, value) =>
          set((state) => ({ mods: { ...state.mods, [key]: value }, error: null })),
        setOutput: (output) => set({ output }),
        setTheme: (theme) => set({ theme }),
        setResult: (result) => set({ result }),
        setError: (error) => set({ error }),
        setComputing: (isComputing) => set({ isComputing }),
        loadSample: () => {
          const meta = operations.find((item) => item.id === get().operation)
          set({
            matrixA: meta?.sampleA ?? get().matrixA,
            matrixB: meta?.sampleB ?? '',
            matrixC: meta?.sampleC ?? '',
            rhs: meta?.sampleRhs ?? '',
            result: null,
            error: null,
          })
        },
        useBlockAsMatrixA: (raw) =>
          set({ matrixA: raw, operation: 'rref', result: null, error: null }),
      }),
      {
        name: 'ma1522-calculator',
        partialize: (state) => ({
          operation: state.operation,
          matrixA: state.matrixA,
          matrixB: state.matrixB,
          matrixC: state.matrixC,
          rhs: state.rhs,
          k: state.k,
          mods: state.mods,
          output: state.output,
          theme: state.theme,
        }),
      },
    ),
    {
      limit: 80,
      partialize: (state): TrackedState => ({
        operation: state.operation,
        matrixA: state.matrixA,
        matrixB: state.matrixB,
        matrixC: state.matrixC,
        rhs: state.rhs,
        k: state.k,
        mods: state.mods,
        output: state.output,
      }),
    },
  ),
)
