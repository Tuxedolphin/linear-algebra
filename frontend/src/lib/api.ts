import type {
  ComputeError,
  ComputeRequest,
  ComputeResponse,
  EquivalentResponse,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function isComputeError(payload: unknown): payload is ComputeError {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as ComputeError).error?.message === 'string'
  )
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as TResponse | ComputeError

  if (!response.ok) {
    const message = isComputeError(payload)
      ? payload.error.message
      : `Request failed with ${response.status}`
    throw new Error(message)
  }

  return payload as TResponse
}

export function compute(request: ComputeRequest): Promise<ComputeResponse> {
  return postJson<ComputeResponse>('/api/v2/compute', request)
}

export function equivalent(matrix: string): Promise<EquivalentResponse> {
  return postJson<EquivalentResponse>('/api/v2/equivalent', { matrix })
}
