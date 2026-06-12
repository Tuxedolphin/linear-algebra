from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.operations import run_operation
from app.schemas import ComputeError, ComputeRequest, ErrorDetail


router = APIRouter(prefix="/api/v2")


@router.post("/compute")
async def compute(request: ComputeRequest):
    try:
        return run_operation(request)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content=ComputeError(error=ErrorDetail(code="compute", message=str(exc))).model_dump(),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=400,
            content=ComputeError(error=ErrorDetail(code="compute", message=str(exc))).model_dump(),
        )
