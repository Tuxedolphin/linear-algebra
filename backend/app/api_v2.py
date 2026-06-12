from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.equivalent import build_equivalent_statements
from app.operations import run_operation
from app.parse import parse_input
from app.schemas import ComputeError, ComputeRequest, ErrorDetail


router = APIRouter(prefix="/api/v2")
_executor = ThreadPoolExecutor(max_workers=4)
COMPUTE_TIMEOUT = 30


class MatrixOnly(BaseModel):
    matrix: str


def _error_response(
    code: str,
    message: str,
    *,
    status_code: int = 400,
    cell: dict[str, int] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=ComputeError(
            error=ErrorDetail(code=code, message=message, cell=cell)
        ).model_dump(),
    )


@router.post("/compute")
async def compute(request: ComputeRequest):
    loop = asyncio.get_event_loop()
    try:
        response = await asyncio.wait_for(
            loop.run_in_executor(_executor, run_operation, request),
            timeout=COMPUTE_TIMEOUT,
        )
        return JSONResponse(content=response.model_dump(by_alias=True))
    except asyncio.TimeoutError:
        return _error_response(
            "timeout",
            f"Computation exceeded {COMPUTE_TIMEOUT}s.",
            status_code=504,
        )
    except ValueError as exc:
        return _error_response("parse", str(exc))
    except Exception as exc:
        return _error_response("compute", str(exc))


@router.post("/parse")
async def parse(body: MatrixOnly):
    try:
        matrix = parse_input(body.matrix)
    except ValueError as exc:
        return _error_response("parse", str(exc))
    cells = [[str(matrix[row, col]) for col in range(matrix.cols)] for row in range(matrix.rows)]
    return {"rows": matrix.rows, "cols": matrix.cols, "cells": cells}


@router.post("/equivalent")
async def equivalent(body: MatrixOnly):
    try:
        matrix = parse_input(body.matrix)
    except ValueError as exc:
        return _error_response("parse", str(exc))
    return build_equivalent_statements(matrix)
