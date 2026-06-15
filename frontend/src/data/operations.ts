type OperationInput = 'matrixB' | 'matrixC' | 'rhs' | 'k' | 'mods'

export type OperationMeta = {
  id: string
  label: string
  group: string
  summary: string
  inputs?: OperationInput[]
  sampleA?: string
  sampleB?: string
  sampleC?: string
  sampleRhs?: string
}

const baseMatrix = '[1 2 1; 2 4 0; 0 1 3]'
const squareMatrix = '[2 1; 1 2]'
const tallMatrix = '[1 1; 1 2; 1 3]'
const rhsVector = '[1; 0; 2]'

export const operations: OperationMeta[] = [
  {
    id: 'ref',
    label: 'Row echelon form',
    group: 'Core reductions',
    summary: 'Upper-triangular working with row-operation steps.',
    sampleA: baseMatrix,
  },
  {
    id: 'rref',
    label: 'Reduced row echelon form',
    group: 'Core reductions',
    summary: 'Canonical row-reduced matrix.',
    sampleA: baseMatrix,
  },
  {
    id: 'rank',
    label: 'Rank and nullity',
    group: 'Core reductions',
    summary: 'Rank-nullity values for the input matrix.',
    sampleA: baseMatrix,
  },
  {
    id: 'det',
    label: 'Determinant',
    group: 'Square matrices',
    summary: 'Determinant of a square matrix.',
    sampleA: squareMatrix,
  },
  {
    id: 'inv',
    label: 'Inverse',
    group: 'Square matrices',
    summary: 'Two-sided inverse, or one-sided inverses where applicable.',
    sampleA: squareMatrix,
  },
  {
    id: 'lu',
    label: 'LU factorization',
    group: 'Factorizations',
    summary: 'Permutation, lower, and upper triangular factors.',
    sampleA: baseMatrix,
  },
  {
    id: 'qr',
    label: 'QR factorization',
    group: 'Factorizations',
    summary: 'Orthogonal and upper triangular factors.',
    sampleA: tallMatrix,
  },
  {
    id: 'svd',
    label: 'Singular value decomposition',
    group: 'Factorizations',
    summary: 'U, Sigma, and V-transpose factors.',
    sampleA: '[1 0; 0 2; 0 0]',
  },
  {
    id: 'gram_schmidt',
    label: 'Gram-Schmidt',
    group: 'Orthogonality',
    summary: 'Orthonormal basis generated from columns.',
    sampleA: tallMatrix,
  },
  {
    id: 'orth_complement',
    label: 'Orthogonal complement',
    group: 'Orthogonality',
    summary: 'Basis for the complement of the column space.',
    sampleA: tallMatrix,
  },
  {
    id: 'col_constraints',
    label: 'Column constraints',
    group: 'Spaces and bases',
    summary: 'Linear constraints among columns.',
    sampleA: baseMatrix,
  },
  {
    id: 'extend_basis',
    label: 'Extend basis',
    group: 'Spaces and bases',
    summary: 'Extends independent columns to a full basis.',
    sampleA: '[1 0; 0 1; 1 1]',
  },
  {
    id: 'nullspace',
    label: 'Null space',
    group: 'Spaces and bases',
    summary: 'Basis vectors for Null(A).',
    sampleA: baseMatrix,
  },
  {
    id: 'colspace',
    label: 'Column space',
    group: 'Spaces and bases',
    summary: 'Basis vectors for Col(A).',
    sampleA: baseMatrix,
  },
  {
    id: 'eigenvals',
    label: 'Eigenvalues',
    group: 'Eigen theory',
    summary: 'Eigenvalues with algebraic multiplicity.',
    sampleA: squareMatrix,
  },
  {
    id: 'eigenvects',
    label: 'Eigenvectors',
    group: 'Eigen theory',
    summary: 'Eigenspace basis vectors by eigenvalue.',
    sampleA: squareMatrix,
  },
  {
    id: 'diagonalize',
    label: 'Diagonalize',
    group: 'Eigen theory',
    summary: 'P and D matrices where A = PDP^{-1}.',
    sampleA: squareMatrix,
  },
  {
    id: 'orth_diagonalize',
    label: 'Orthogonal diagonalize',
    group: 'Eigen theory',
    summary: 'Orthogonal P and diagonal D for symmetric matrices.',
    sampleA: squareMatrix,
  },
  {
    id: 'solve',
    label: 'Solve Ax = b',
    group: 'Systems',
    summary: 'Exact solution vector when the system is consistent.',
    inputs: ['rhs'],
    sampleA: squareMatrix,
    sampleRhs: '[3; 0]',
  },
  {
    id: 'least_squares',
    label: 'Least squares',
    group: 'Systems',
    summary: 'Best-fit solution for overdetermined systems.',
    inputs: ['rhs'],
    sampleA: tallMatrix,
    sampleRhs: rhsVector,
  },
  {
    id: 'projection',
    label: 'Projection',
    group: 'Systems',
    summary: 'Least-squares solution and projected vector.',
    inputs: ['rhs'],
    sampleA: tallMatrix,
    sampleRhs: rhsVector,
  },
  {
    id: 'intersect',
    label: 'Intersect subspaces',
    group: 'Subspaces',
    summary: 'Intersection basis for two column spaces.',
    inputs: ['matrixB'],
    sampleA: '[1 0; 0 1; 1 1]',
    sampleB: '[1 1; 1 0; 0 1]',
  },
  {
    id: 'transition',
    label: 'Transition matrix',
    group: 'Subspaces',
    summary: 'Change-of-basis matrix from one basis to another.',
    inputs: ['matrixB'],
    sampleA: '[1 0; 0 1]',
    sampleB: '[1 1; 1 -1]',
  },
  {
    id: 'markov_steady',
    label: 'Markov steady state',
    group: 'Applications',
    summary: 'Equilibrium distribution of a transition matrix.',
    sampleA: '[0.8 0.3; 0.2 0.7]',
  },
  {
    id: 'markov_kstep',
    label: 'Markov k-step state',
    group: 'Applications',
    summary: 'Distribution after k transition steps.',
    inputs: ['rhs', 'k'],
    sampleA: '[0.8 0.3; 0.2 0.7]',
    sampleRhs: '[1; 0]',
  },
  {
    id: 'eval_cases',
    label: 'Evaluate cases',
    group: 'Parametric systems',
    summary: 'Evaluates parameter cases against a right-hand side.',
    inputs: ['rhs'],
    sampleA: '[1 a; 0 a-1]',
    sampleRhs: '[1; 2]',
  },
  {
    id: 'find_cases',
    label: 'Find all cases',
    group: 'Parametric systems',
    summary: 'Finds singular or rank-changing parameter cases.',
    sampleA: '[1 a; 0 a-1]',
  },
  {
    id: 'chain_multiply',
    label: 'Chain multiply',
    group: 'Matrix products',
    summary: 'Multiplies two or three matrices with transpose/inverse modifiers.',
    inputs: ['matrixB', 'matrixC', 'mods'],
    sampleA: '[1 2; 3 4]',
    sampleB: '[2 0; 1 2]',
    sampleC: '[1 0; 0 1]',
  },
]

export const defaultOperation = operations[0]

export const operationById = new Map(operations.map((operation) => [operation.id, operation]))
