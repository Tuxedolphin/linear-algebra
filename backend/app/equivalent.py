from __future__ import annotations

import warnings

from ma1522.symbolic import Matrix


def build_equivalent_statements(mat: Matrix) -> dict:
    rows, cols = mat.rows, mat.cols
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        rank = mat.rank()
    nullity = cols - rank

    statements = []
    category = ""

    if rows == cols:
        is_invertible = rank == rows

        if is_invertible:
            category = f"Square Matrix ({rows}x{rows}) - Invertible (Non-Singular)"
            statements = [
                "\\(\\det(A) \\neq 0\\)",
                "\\(AB = BA = I\\) (inverse exists)",
                "\\(A\\) has both a left and a right inverse",
                "\\(A^T\\) is invertible",
                "\\(A\\) is row equivalent to \\(I\\) (RREF is \\(I\\))",
                "\\(A\\) can be expressed as a product of elementary matrices",
                "\\(0\\) is not an eigenvalue of \\(A\\)",
                "\\(Ax = 0\\) has only the trivial solution \\(x = 0\\)",
                "\\(Ax = b\\) has a unique solution for all \\(b\\)",
                "\\(T(x) = Ax\\) is bijective (injective & surjective)",
                "\\(\\mathrm{Null}(A) = \\{0\\}\\) and \\(\\mathrm{nullity}(A) = 0\\)",
                "Columns of \\(A\\) are linearly independent",
                "Rows of \\(A\\) are linearly independent",
                "\\(\\mathrm{Col}(A) = \\mathbb{R}^n\\)",
                "\\(\\mathrm{Row}(A) = \\mathbb{R}^n\\)",
                f"\\(\\mathrm{{rank}}(A) = {rows}\\) (full rank)",
            ]
        else:
            category = f"Square Matrix ({rows}x{rows}) - Singular (Non-Invertible)"
            statements = [
                "\\(\\det(A) = 0\\)",
                "\\(A\\) has no left inverse and no right inverse",
                "\\(A^T\\) is singular",
                "\\(A\\) is not row equivalent to \\(I\\)",
                "RREF of \\(A\\) contains at least one zero row",
                "RREF of \\(A\\) contains non-pivot columns",
                "\\(0\\) is an eigenvalue of \\(A\\)",
                "\\(Ax = 0\\) has non-trivial solutions",
                "For some \\(b\\), \\(Ax = b\\) is inconsistent",
                "\\(T(x) = Ax\\) is neither injective nor surjective",
                "\\(\\mathrm{Null}(A) \\neq \\{0\\}\\) and \\(\\mathrm{nullity}(A) > 0\\)",
                "Columns of \\(A\\) are linearly dependent",
                "Rows of \\(A\\) are linearly dependent",
                "\\(\\mathrm{Col}(A) \\neq \\mathbb{R}^n\\)",
                "\\(\\mathrm{Row}(A) \\neq \\mathbb{R}^n\\)",
                f"\\(\\mathrm{{rank}}(A) < {rows}\\)",
            ]
    elif rank == cols:
        category = f"Rectangular Matrix ({rows}x{cols}) - Full Column Rank"
        statements = [
            f"\\(\\mathrm{{rank}}(A) = {cols}\\) (maximum possible rank)",
            "Columns of \\(A\\) are linearly independent",
            "\\(Ax = 0\\) has only the trivial solution",
            "\\(A^T A\\) is invertible",
            "\\(A\\) has a left inverse",
            "\\(T(x) = Ax\\) is injective (one-to-one)",
            "If \\(Ax = v\\) is consistent, the solution is unique",
            "Least squares: unique solution for \\(Ax = b\\)",
        ]
    elif rank == rows:
        category = f"Rectangular Matrix ({rows}x{cols}) - Full Row Rank"
        statements = [
            f"\\(\\mathrm{{rank}}(A) = {rows}\\) (maximum possible rank)",
            "Rows of \\(A\\) are linearly independent",
            "Columns of \\(A\\) span \\(\\mathbb{R}^m\\)",
            "\\(Ax = b\\) is consistent for every \\(b\\)",
            "\\(AA^T\\) is invertible",
            "\\(A\\) has a right inverse",
            "\\(T(x) = Ax\\) is surjective (onto)",
            f"\\(\\mathrm{{nullity}}(A) = {cols} - {rows} = {cols - rows}\\)",
        ]
    else:
        category = f"Rectangular Matrix ({rows}x{cols}) - Rank Deficient"
        statements = [
            "Both \\(A^T A\\) and \\(AA^T\\) are singular",
            "\\(A\\) has neither a left nor a right inverse",
            "Columns are linearly dependent AND rows are linearly dependent",
            "\\(\\mathrm{Col}(A) \\neq \\mathbb{R}^m\\) AND \\(\\mathrm{Row}(A) \\neq \\mathbb{R}^n\\)",
            "\\(Ax = 0\\) has non-trivial solutions",
            "\\(Ax = b\\) is inconsistent for some \\(b\\)",
            "RREF contains non-pivot columns AND zero rows",
            f"\\(\\mathrm{{nullity}}(A) > {max(0, cols - rows)}\\)",
        ]

    return {
        "category": category,
        "statements": statements,
        "properties": {
            "rows": rows,
            "cols": cols,
            "rank": int(rank),
            "nullity": int(nullity),
        },
    }
