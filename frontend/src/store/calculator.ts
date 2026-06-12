import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'

import { compute } from '../lib/api'
import { defaultOperation, operations } from '../data/operations'
import type { ComputeResponse, MatrixMod, OutputMode } from '../lib/types'

type ThemeMode = 'system' | 'light' | 'dark'

const HISTORY_LIMIT = 50

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(performance.now())}`
}

export type HistoryEntry = {
  id: string
  ts: number
  operation: string
  label: string
  matrixA: string
  matrixB: string
  matrixC: string
  rhs: string
  k: number
  mods: { m1: MatrixMod; m2: MatrixMod; m3: MatrixMod }
  output: OutputMode
  result: ComputeResponse
}

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
  history: HistoryEntry[]
  setOperation: (operation: string) => void
  setMatrix: (key: 'matrixA' | 'matrixB' | 'matrixC' | 'rhs', value: string) => void
  setK: (value: number) => void
  setMod: (key: 'm1' | 'm2' | 'm3', value: MatrixMod) => void
  setOutput: (output: OutputMode) => void
  setTheme: (theme: ThemeMode) => void
  setResult: (result: ComputeResponse | null) => void
  setError: (error: string | null) => void
  setComputing: (isComputing: boolean) => void
  runCompute: () => Promise<void>
  loadSample: () => void
  useBlockAsMatrixA: (raw: string) => void
  restoreFromHistory: (id: string) => void
  clearHistory: () => void
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
        history: [],
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
        setOutput: (output) => {
          if (get().output === output) return
          set({ output })
          // The output mode is part of the compute request, so re-run the
          // operation in place when a result is already on screen.
          if (get().result && !get().isComputing) void get().runCompute()
        },
        setTheme: (theme) => set({ theme }),
        setResult: (result) => set({ result }),
        setError: (error) => set({ error }),
        setComputing: (isComputing) => set({ isComputing }),
        runCompute: async () => {
          const state = get()
          if (state.isComputing) return
          set({ isComputing: true, error: null })
          try {
            const response = await compute({
              operation: state.operation,
              matrixA: state.matrixA,
              matrixB: state.matrixB.trim() ? state.matrixB : null,
              matrixC: state.matrixC.trim() ? state.matrixC : null,
              rhs: state.rhs.trim() ? state.rhs : null,
              k: state.k,
              mods: state.mods,
              output: state.output,
            })
            const entry: HistoryEntry = {
              id: makeId(),
              ts: Date.now(),
              operation: state.operation,
              label:
                operations.find((item) => item.id === state.operation)?.label ??
                state.operation,
              matrixA: state.matrixA,
              matrixB: state.matrixB,
              matrixC: state.matrixC,
              rhs: state.rhs,
              k: state.k,
              mods: state.mods,
              output: state.output,
              result: response,
            }
            set((current) => ({
              result: response,
              history: [entry, ...current.history].slice(0, HISTORY_LIMIT),
            }))
          } catch (error) {
            set({
              result: null,
              error: error instanceof Error ? error.message : 'Computation failed.',
            })
          } finally {
            set({ isComputing: false })
          }
        },
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
        // Chaining loads the result into Matrix A without changing the
        // selected operation or discarding the result already on screen.
        useBlockAsMatrixA: (raw) => set({ matrixA: raw, error: null }),
        restoreFromHistory: (id) => {
          const entry = get().history.find((item) => item.id === id)
          if (!entry) return
          set({
            operation: entry.operation,
            matrixA: entry.matrixA,
            matrixB: entry.matrixB,
            matrixC: entry.matrixC,
            rhs: entry.rhs,
            k: entry.k,
            mods: entry.mods,
            output: entry.output,
            result: entry.result,
            error: null,
          })
        },
        clearHistory: () => set({ history: [] }),
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
          history: state.history,
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
