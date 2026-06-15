from __future__ import annotations

import ast

import sympy as sym
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

from ma1522.symbolic import Matrix


_TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)


def _parse_cell(text: str) -> sym.Expr:
    try:
        return parse_expr(text, transformations=_TRANSFORMATIONS)
    except Exception as exc:
        raise ValueError(f"Failed to parse cell '{text}': {exc}") from exc


def _parse_bracket_format(text: str) -> Matrix:
    body = text.strip()[1:-1].strip()
    if not body:
        raise ValueError("Empty matrix")

    rows: list[list[sym.Expr]] = []
    for row_text in body.split(";"):
        row_text = row_text.strip()
        if not row_text:
            continue
        if "," in row_text:
            tokens = [token.strip() for token in row_text.split(",") if token.strip()]
            rows.append([_parse_cell(token) for token in tokens])
            continue

        tokens = [token.strip() for token in row_text.split() if token.strip()]
        try:
            rows.append([_parse_cell(token) for token in tokens])
        except ValueError:
            rows.append([_parse_cell(row_text)])

    if not rows:
        raise ValueError("Empty matrix")

    column_counts = {len(row) for row in rows}
    if len(column_counts) != 1:
        expected = len(rows[0])
        actual = next(len(row) for row in rows if len(row) != expected)
        raise ValueError(
            f"Row length mismatch: expected {expected} cells, got {actual}. "
            "Use commas to separate cells when expressions contain spaces."
        )

    return Matrix(rows).applyfunc(lambda x: sym.nsimplify(x, rational=True))


def _parse_python_literal(text: str) -> Matrix:
    try:
        value = ast.literal_eval(text)
    except Exception as exc:
        raise ValueError(f"Failed to parse Python list matrix: {exc}") from exc

    if not isinstance(value, list):
        raise ValueError("Python matrix input must be a list.")

    rows = []
    for row in value:
        if isinstance(row, list):
            rows.append([sym.nsimplify(item, rational=True) for item in row])
        else:
            rows.append([sym.nsimplify(row, rational=True)])

    return Matrix(rows)


def parse_input(text: str) -> Matrix:
    """Parse matrix input accepted by the v2 API.

    Bracket format is the canonical client/server format: ``[1 2; 3 4]``.
    Python lists and LaTeX matrices are accepted for compatibility with the
    legacy frontend and public docs.
    """
    s = text.strip()
    if not s:
        raise ValueError("Matrix input is required.")

    if s.count("(") != s.count(")"):
        raise ValueError("Unbalanced parentheses.")

    if "begin" in s or ("\\" in s and any(char in s for char in "{}[]")):
        return Matrix.from_latex(s, verbosity=0).applyfunc(lambda x: sym.nsimplify(x, rational=True))

    if s.startswith("[") and s.endswith("]"):
        if s.startswith("[["):
            try:
                return _parse_python_literal(s)
            except ValueError:
                pass
        return _parse_bracket_format(s)

    raise ValueError("Matrix must be wrapped in [ ].")


parse_matrix = parse_input


def to_latex(expr: sym.Expr | sym.MatrixBase) -> str:
    return sym.latex(expr)


def to_bmatrix(matrix: sym.MatrixBase) -> str:
    rows = [
        " & ".join(sym.latex(matrix[row, col]) for col in range(matrix.cols))
        for row in range(matrix.rows)
    ]
    return "\\begin{bmatrix}" + " \\\\ ".join(rows) + "\\end{bmatrix}"


def to_raw(matrix: sym.MatrixBase) -> str:
    rows = [
        " ".join(str(matrix[row, col]) for col in range(matrix.cols))
        for row in range(matrix.rows)
    ]
    return "[" + "; ".join(rows) + "]"
