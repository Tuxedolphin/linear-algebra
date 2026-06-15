from __future__ import annotations

import warnings
from collections.abc import Callable

import sympy as sym

from app.parse import parse_input, to_bmatrix, to_latex, to_raw
from app.schemas import (
    ComputeRequest,
    ComputeResponse,
    MatrixBlock,
    Mods,
    ResultBlock,
    ScalarBlock,
    Step,
    VectorItem,
    VectorListBlock,
)
from app.steps import capture, capture_steps, parse_steps, safe_capture
from ma1522.symbolic import Matrix


OperationHandler = Callable[[ComputeRequest], ComputeResponse]


def run_operation(request: ComputeRequest) -> ComputeResponse:
    try:
        handler = OP_REGISTRY[request.operation]
    except KeyError as exc:
        raise ValueError(f"Unknown operation: {request.operation}") from exc
    return handler(request)


def _matrix_block(label: str, matrix: sym.MatrixBase, note: str | None = None) -> MatrixBlock:
    return MatrixBlock(label=label, latex=to_bmatrix(matrix), raw=to_raw(matrix), note=note)


def _scalar_block(label: str, expr: sym.Expr | int | str) -> ScalarBlock:
    return ScalarBlock(label=label, latex=to_latex(sym.sympify(expr)))


def _vector_list_block(label: str, vectors: list[sym.MatrixBase]) -> VectorListBlock:
    return VectorListBlock(
        label=label,
        items=[
            VectorItem(label=f"v_{index}", latex=to_bmatrix(vector), raw=to_raw(vector))
            for index, vector in enumerate(vectors, start=1)
        ],
    )


def _parse_a(request: ComputeRequest) -> Matrix:
    return parse_input(request.matrixA)


def _parse_optional(text: str | None) -> Matrix | None:
    return parse_input(text) if text and text.strip() else None


def _rhs_or_zero(request: ComputeRequest, rows: int) -> Matrix:
    rhs = _parse_optional(request.rhs)
    return rhs if rhs is not None else _zero_col_vector(rows)


def _zero_col_vector(rows: int) -> Matrix:
    return Matrix([[0]] * rows)


def _maybe_decimal_matrix(matrix: sym.MatrixBase, output: str) -> sym.MatrixBase:
    if output != "decimal":
        return matrix
    try:
        return matrix.applyfunc(lambda value: value.evalf(12) if not value.free_symbols else value)
    except AttributeError:
        return matrix


def _maybe_decimal_expr(expr: sym.Expr | int, output: str) -> sym.Expr:
    value = sym.sympify(expr)
    if output != "decimal" or value.free_symbols:
        return value
    return value.evalf(12)


def _blocks_response(
    request: ComputeRequest, blocks: list[ResultBlock], steps: list[Step] | None = None
) -> ComputeResponse:
    return ComputeResponse(operation=request.operation, blocks=blocks, steps=steps or [])


# Branch/completion chatter printed by the recursive symbolic RREF engine
# (``rref_cases``). For a numeric matrix these are just empty-case markers; they
# are noise as worked steps, so they are filtered out.
_STEP_NOISE_PREFIXES = ("Completed branch", "Branching on", "Branch ")


def _renumber(steps: list[Step]) -> list[Step]:
    for index, step in enumerate(steps, start=1):
        step.n = index
    return steps


def _denoise_steps(steps: list[Step]) -> list[Step]:
    """Drop the symbolic-RREF branch/completion chatter, then renumber."""
    kept: list[Step] = []
    for step in steps:
        plain = (step.descriptionLatex or "").replace("\\text{", "").replace("}", "").strip()
        if plain == "{}" or any(plain.startswith(prefix) for prefix in _STEP_NOISE_PREFIXES):
            continue
        kept.append(step)
    return _renumber(kept)


def _rref_steps(matrix: Matrix) -> list[Step]:
    """Capture the full step-by-step reduction to RREF.

    ``rref_cases(verbosity=2)`` drives the library's recursive symbolic-RREF
    engine, which prints every elementary row operation with a matrix snapshot
    after each — the granular working a student reproduces by hand.
    """
    raw = safe_capture(lambda: matrix.rref_cases(verbosity=2))
    return _denoise_steps(parse_steps(raw))


def _rref(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    steps = _rref_steps(matrix)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        result = matrix.rref()[0]
    result = _maybe_decimal_matrix(result, request.output)
    return _blocks_response(request, [_matrix_block("RREF", result)], steps)


def _ref(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.ref(verbosity=2))
    matrix_u = _maybe_decimal_matrix(result.U, request.output)
    return _blocks_response(request, [_matrix_block("REF", matrix_u)], parse_steps(raw_steps))


def _lu(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.ref(verbosity=2))
    blocks = [
        _matrix_block("P", _maybe_decimal_matrix(result.P, request.output)),
        _matrix_block("L", _maybe_decimal_matrix(result.L, request.output)),
        _matrix_block("U", _maybe_decimal_matrix(result.U, request.output)),
    ]
    return _blocks_response(request, blocks, parse_steps(raw_steps))


def _qr(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    steps = capture_steps(lambda: matrix.gram_schmidt(verbosity=1))
    q_matrix, r_matrix = matrix.QRdecomposition()
    return _blocks_response(
        request,
        [
            _matrix_block("Q", _maybe_decimal_matrix(q_matrix, request.output)),
            _matrix_block("R", _maybe_decimal_matrix(r_matrix, request.output)),
        ],
        steps,
    )


def _gram_schmidt(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.gram_schmidt(verbosity=1))
    result_matrix = result.eval() if not hasattr(result, "rows") else result
    result_matrix = _maybe_decimal_matrix(result_matrix, request.output)
    return _blocks_response(request, [_matrix_block("Orthonormal basis", result_matrix)], parse_steps(raw_steps))


def _svd(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.singular_value_decomposition(verbosity=1))
    return _blocks_response(
        request,
        [
            _matrix_block("U", _maybe_decimal_matrix(result.U, request.output)),
            _matrix_block("Sigma", _maybe_decimal_matrix(result.S, request.output)),
            _matrix_block("V^T", _maybe_decimal_matrix(result.V.T, request.output)),
        ],
        parse_steps(raw_steps),
    )


def _det(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    return _blocks_response(request, [_scalar_block("det(A)", _maybe_decimal_expr(matrix.det(), request.output))])


def _inv(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    rank = matrix.rank()
    full_col = rank == matrix.cols
    full_row = rank == matrix.rows
    blocks: list[ResultBlock] = []
    steps: list[Step] = []

    def add(option: str, label: str, note: str | None = None) -> None:
        result, raw_steps = capture(lambda: matrix.inverse(option=option, verbosity=1))
        blocks.append(_matrix_block(label, _maybe_decimal_matrix(result, request.output), note))
        steps.extend(parse_steps(raw_steps))

    if full_col and full_row:
        add("both", "A^{-1}", "Left and right inverse")
    else:
        if full_col:
            add("left", "Left inverse")
        if full_row:
            add("right", "Right inverse")
        if not blocks:
            blocks.append(ScalarBlock(label="Inverse", latex="\\text{No inverse exists}"))

    return _blocks_response(request, blocks, steps)


def _rank(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    steps = _rref_steps(matrix)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        rank = matrix.rank()
    nullity = matrix.cols - rank
    steps.append(
        Step(
            n=len(steps) + 1,
            descriptionLatex=(
                r"\text{rank}(A) = \text{number of pivots} = " + str(rank)
                + r",\quad \text{nullity}(A) = " + str(matrix.cols) + " - " + str(rank)
                + " = " + str(nullity)
            ),
        )
    )
    return _blocks_response(
        request,
        [_scalar_block("rank(A)", rank), _scalar_block("nullity(A)", nullity)],
        steps,
    )


# Both eigen handlers reuse the diagonalize verbose path, which prints the
# characteristic polynomial followed by, for each real eigenvalue, the matrix
# (lambda*I - A), its RREF, and the resulting eigenvectors. The printing happens
# before diagonalize may raise (non-diagonalizable), so safe_capture keeps it.
def _eigen_steps(matrix: Matrix) -> list[Step]:
    # parse_steps already numbers its output 1..N, so no _renumber is needed.
    raw = safe_capture(lambda: matrix.diagonalize(verbosity=1))
    return parse_steps(raw)


def _eigenvals(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    blocks = [
        ScalarBlock(label=f"lambda (mult. {mult})", latex=to_latex(_maybe_decimal_expr(value, request.output)))
        for value, mult in matrix.eigenvals().items()
    ]
    return _blocks_response(request, blocks, _eigen_steps(matrix))


def _eigenvects(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    blocks: list[ResultBlock] = []
    for value, mult, vectors in matrix.eigenvects():
        blocks.append(_vector_list_block(f"lambda = {to_latex(value)} (mult. {mult})", vectors))
    return _blocks_response(request, blocks, _eigen_steps(matrix))


def _diagonalize(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.diagonalize(verbosity=1))
    return _blocks_response(
        request,
        [
            _matrix_block("P", _maybe_decimal_matrix(result.P, request.output)),
            _matrix_block("D", _maybe_decimal_matrix(result.D, request.output)),
        ],
        parse_steps(raw_steps),
    )


def _orth_diagonalize(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.orthogonally_diagonalize(verbosity=1))
    return _blocks_response(
        request,
        [
            _matrix_block("P", _maybe_decimal_matrix(result.P, request.output)),
            _matrix_block("D", _maybe_decimal_matrix(result.D, request.output)),
        ],
        parse_steps(raw_steps),
    )


def _nullspace(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    vectors, raw_steps = capture(lambda: matrix.nullspace(verbosity=1))
    return _blocks_response(
        request,
        [_vector_list_block("Null(A)", vectors)],
        parse_steps(raw_steps),
    )


def _colspace(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    steps = _rref_steps(matrix)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        vectors = matrix.columnspace()
    steps.append(
        Step(
            n=len(steps) + 1,
            descriptionLatex=(
                r"\text{The pivot columns of } A \text{ (the original columns at the pivot "
                r"positions above) form a basis for the column space.}"
            ),
        )
    )
    return _blocks_response(request, [_vector_list_block("Col(A)", vectors)], steps)


def _orth_complement(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.orthogonal_complement(verbosity=1))
    return _blocks_response(
        request,
        [_matrix_block("(Col(A))^perp", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _col_constraints(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.column_constraints(verbosity=1))
    return _blocks_response(
        request,
        [_matrix_block("Column constraints", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _extend_basis(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    result, raw_steps = capture(lambda: matrix.extend_basis(verbosity=2))
    return _blocks_response(
        request,
        [_matrix_block("Extended basis", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _solve(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    rhs = _rhs_or_zero(request, matrix.rows)
    # solve() prints its augmented-RREF working before it may raise on an
    # inconsistent system, so capture the working either way (it explains *why*
    # there is no solution) and keep whatever solution vectors were found.
    solutions: list[sym.MatrixBase] = []
    raw_steps = safe_capture(lambda: solutions.extend(matrix.solve(rhs, verbosity=1)))
    steps = parse_steps(raw_steps)
    if not solutions:
        return _blocks_response(
            request, [ScalarBlock(label="Solution", latex="\\text{No solution}")], steps
        )
    if len(solutions) == 1:
        blocks: list[ResultBlock] = [
            _matrix_block("x", _maybe_decimal_matrix(solutions[0], request.output))
        ]
    else:
        blocks = [
            _matrix_block(f"x_{index}", _maybe_decimal_matrix(solution, request.output))
            for index, solution in enumerate(solutions, start=1)
        ]
    return _blocks_response(request, blocks, steps)


def _least_squares_solution(matrix: Matrix, rhs: Matrix) -> tuple[sym.MatrixBase, str]:
    """Least-squares solution x_hat with its working, falling back to the
    pseudo-inverse when the verbose solver cannot index a result."""
    try:
        return capture(lambda: matrix.solve_least_squares(rhs, verbosity=1))
    except (IndexError, KeyError):
        return matrix.pinv() @ rhs, ""


def _least_squares(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    rhs = _rhs_or_zero(request, matrix.rows)
    result, raw_steps = _least_squares_solution(matrix, rhs)
    return _blocks_response(
        request,
        [_matrix_block("x_hat", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _projection(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    rhs = _rhs_or_zero(request, matrix.rows)
    x_hat, raw_steps = _least_squares_solution(matrix, rhs)
    projection = matrix @ x_hat
    return _blocks_response(
        request,
        [
            _matrix_block("x_hat", _maybe_decimal_matrix(x_hat, request.output)),
            _matrix_block("p", _maybe_decimal_matrix(projection, request.output)),
        ],
        parse_steps(raw_steps),
    )


def _intersect(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    other = _parse_optional(request.matrixB)
    if other is None:
        raise ValueError("This operation requires matrixB.")
    result, raw_steps = capture(lambda: matrix.intersect_subspace(other, verbosity=2))
    return _blocks_response(
        request,
        [_matrix_block("Intersection", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _transition(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    other = _parse_optional(request.matrixB)
    if other is None:
        raise ValueError("This operation requires matrixB.")
    result, raw_steps = capture(lambda: matrix.transition_matrix(other, verbosity=2))
    return _blocks_response(
        request,
        [_matrix_block("Transition matrix", _maybe_decimal_matrix(result, request.output))],
        parse_steps(raw_steps),
    )


def _eval_cases(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    rhs = _rhs_or_zero(request, matrix.rows)
    _, raw_steps = capture(lambda: matrix.evaluate_cases(rhs))
    return _blocks_response(request, [ScalarBlock(label="Cases", latex="\\text{See working}")], parse_steps(raw_steps))


def _find_cases(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    cases = matrix.find_all_cases()
    if not cases:
        return _blocks_response(request, [ScalarBlock(label="Cases", latex="\\text{No parametric cases}")])
    latex = ", ".join(
        "\\{" + ", ".join(f"{to_latex(key)} = {to_latex(value)}" for key, value in case.items()) + "\\}"
        for case in cases
    )
    return _blocks_response(request, [ScalarBlock(label="Cases", latex=latex)])


_MOD_LABEL: dict[str, Callable[[str], str]] = {
    "none": lambda name: name,
    "T": lambda name: f"{name}^{{T}}",
    "inv": lambda name: f"{name}^{{-1}}",
    "inv_T": lambda name: f"\\left({name}^{{-1}}\\right)^{{T}}",
}

_MOD_APPLY: dict[str, Callable[[sym.MatrixBase], sym.MatrixBase]] = {
    "none": lambda matrix: matrix,
    "T": lambda matrix: matrix.T,
    "inv": lambda matrix: matrix.inv(),
    "inv_T": lambda matrix: matrix.inv().T,
}


def _operand_label(name: str, mod: str) -> str:
    return _MOD_LABEL.get(mod, _MOD_LABEL["none"])(name)


def _apply_mod(matrix: sym.MatrixBase, mod: str) -> sym.MatrixBase:
    if mod not in _MOD_APPLY:
        raise ValueError(f"Unknown modifier '{mod}'. Must be one of: none, T, inv, inv_T")
    return _MOD_APPLY[mod](matrix)


def _chain_multiply(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    other = _parse_optional(request.matrixB)
    third = _parse_optional(request.matrixC)
    mods = request.mods or Mods()
    operands = [(matrix, mods.m1)]
    if other is not None:
        operands.append((other, mods.m2))
    if third is not None:
        operands.append((third, mods.m3))
    if len(operands) < 2:
        raise ValueError("chain_multiply requires at least two matrices.")

    names = ["A", "B", "C"]
    result = _apply_mod(operands[0][0], operands[0][1])
    expr = _operand_label(names[0], operands[0][1])
    steps: list[Step] = []
    for index, (operand, mod) in enumerate(operands[1:], start=1):
        result = (result @ _apply_mod(operand, mod)).doit()
        expr = f"{expr} {_operand_label(names[index], mod)}"
        steps.append(
            Step(
                n=len(steps) + 1,
                descriptionLatex=f"{expr} =",
                matrixLatex=to_bmatrix(_maybe_decimal_matrix(result, request.output)),
            )
        )
    return _blocks_response(
        request,
        [_matrix_block("Product", _maybe_decimal_matrix(result, request.output))],
        steps,
    )


def _markov_steady(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    # Steady state pi solves (I - A) pi = 0, i.e. it is the nullspace of (I - A),
    # then normalised so its entries sum to 1 (mirrors equilibrium_vectors()).
    i_minus_a = matrix.elem() - matrix
    null_raw = safe_capture(lambda: i_minus_a.nullspace(verbosity=1))
    result = matrix.equilibrium_vectors()

    steps: list[Step] = [
        Step(
            n=1,
            descriptionLatex=r"\text{The steady state }\pi\text{ solves }(I - A)\,\pi = 0:",
            matrixLatex=to_bmatrix(_maybe_decimal_matrix(i_minus_a, request.output)),
        )
    ]
    steps.extend(parse_steps(null_raw))
    steps.append(
        Step(
            n=0,
            descriptionLatex=r"\text{Normalise so the entries sum to }1:\quad \pi =",
            matrixLatex=to_bmatrix(_maybe_decimal_matrix(result, request.output)),
        )
    )
    return _blocks_response(
        request,
        [_matrix_block("pi", _maybe_decimal_matrix(result, request.output))],
        _renumber(steps),
    )


def _markov_kstep(request: ComputeRequest) -> ComputeResponse:
    matrix = _parse_a(request)
    initial = _parse_optional(request.rhs)
    if initial is None:
        raise ValueError("Initial state vector x_0 is required.")
    k = request.k or 2
    if k < 1:
        raise ValueError("k must be a positive integer.")
    if k > 100:
        raise ValueError("k must be <= 100.")
    matrix_power = matrix**k
    distribution = matrix_power * initial
    steps = [
        Step(
            n=1,
            descriptionLatex=f"A^{{{k}}} =",
            matrixLatex=to_bmatrix(_maybe_decimal_matrix(matrix_power, request.output)),
        ),
        Step(
            n=2,
            descriptionLatex=f"x_{{{k}}} = A^{{{k}}} x_0 =",
            matrixLatex=to_bmatrix(_maybe_decimal_matrix(distribution, request.output)),
        ),
    ]
    return _blocks_response(
        request,
        [
            _matrix_block(f"A^{k}", _maybe_decimal_matrix(matrix_power, request.output)),
            _matrix_block(f"x_{k}", _maybe_decimal_matrix(distribution, request.output)),
        ],
        steps,
    )


OP_REGISTRY: dict[str, OperationHandler] = {
    "ref": _ref,
    "rref": _rref,
    "det": _det,
    "inv": _inv,
    "rank": _rank,
    "lu": _lu,
    "qr": _qr,
    "svd": _svd,
    "gram_schmidt": _gram_schmidt,
    "eigenvals": _eigenvals,
    "eigenvects": _eigenvects,
    "diagonalize": _diagonalize,
    "orth_diagonalize": _orth_diagonalize,
    "nullspace": _nullspace,
    "colspace": _colspace,
    "orth_complement": _orth_complement,
    "col_constraints": _col_constraints,
    "extend_basis": _extend_basis,
    "solve": _solve,
    "least_squares": _least_squares,
    "projection": _projection,
    "intersect": _intersect,
    "transition": _transition,
    "markov_steady": _markov_steady,
    "markov_kstep": _markov_kstep,
    "eval_cases": _eval_cases,
    "find_cases": _find_cases,
    "chain_multiply": _chain_multiply,
}
