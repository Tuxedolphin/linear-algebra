from __future__ import annotations

import contextlib
import io
import re
import warnings
from collections.abc import Callable
from typing import Any

from app.schemas import Step


_INLINE_MATH_RE = re.compile(r"^\\\((.*)\\\)$", re.DOTALL)
_DISPLAY_MATH_RE = re.compile(r"^\\\[(.*)\\\]$", re.DOTALL)
_TARGET_ROW_RE = re.compile(r"R_\{?(\d+)\}?\s*$")


def capture(fn: Callable[[], Any]) -> tuple[Any, str]:
    """Run a verbose library call and capture its printed working."""
    buf = io.StringIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with contextlib.redirect_stdout(buf):
            result = fn()
    return result, buf.getvalue()


def safe_capture(fn: Callable[[], Any]) -> str:
    """Run a verbose library call and return its printed working, swallowing
    any exception.

    Some verbose methods (e.g. ``diagonalize``) print their working *before*
    a step that may raise (a non-diagonalizable matrix). We still want the
    working that was printed up to that point, so the exception is ignored.
    """
    buf = io.StringIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with contextlib.redirect_stdout(buf):
            try:
                fn()
            except Exception:
                pass
    return buf.getvalue()


def capture_steps(fn: Callable[[], Any]) -> list[Step]:
    """Run a verbose library call and return structured working steps.

    This mirrors the legacy ``backend.app.main.steps_html`` delimiter logic:
    inline ``\\(...\\)`` lines are operation descriptions and display
    ``\\[...\\]`` blocks are matrix snapshots.
    """
    _, raw = capture(fn)
    return parse_steps(raw)


def parse_steps(raw: str) -> list[Step]:
    lines = raw.splitlines()
    steps: list[Step] = []
    pending_description: str | None = None
    i = 0

    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        if line.startswith("\\["):
            block = [lines[i].strip()]
            while i + 1 < len(lines) and not lines[i].strip().endswith("\\]"):
                i += 1
                block.append(lines[i].strip())
            matrix_latex = _strip_display_math("\n".join(block))
            steps.append(
                Step(
                    n=len(steps) + 1,
                    descriptionLatex=pending_description or f"Step {len(steps) + 1}",
                    matrixLatex=matrix_latex,
                    changedRows=_changed_rows_from_description(pending_description),
                )
            )
            pending_description = None
            i += 1
            continue

        description = _strip_inline_math(line)
        if pending_description is not None:
            steps.append(
                Step(
                    n=len(steps) + 1,
                    descriptionLatex=pending_description,
                    changedRows=_changed_rows_from_description(pending_description),
                )
            )
        pending_description = description
        i += 1

    if pending_description is not None:
        steps.append(
            Step(
                n=len(steps) + 1,
                descriptionLatex=pending_description,
                changedRows=_changed_rows_from_description(pending_description),
            )
        )

    return steps


def _strip_inline_math(line: str) -> str:
    match = _INLINE_MATH_RE.match(line)
    return match.group(1).strip() if match else line.strip()


def _strip_display_math(block: str) -> str:
    match = _DISPLAY_MATH_RE.match(block.strip())
    return match.group(1).strip() if match else block.strip()


def _changed_rows_from_description(description: str | None) -> list[int] | None:
    if not description:
        return None
    match = _TARGET_ROW_RE.search(description.strip())
    if not match:
        return None
    return [int(match.group(1)) - 1]
