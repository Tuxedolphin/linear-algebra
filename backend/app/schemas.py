from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


OutputMode = Literal["exact", "decimal"]
Mod = Literal["none", "T", "inv", "inv_T"]


class Mods(BaseModel):
    m1: Mod = "none"
    m2: Mod = "none"
    m3: Mod = "none"


class ComputeRequest(BaseModel):
    operation: str
    matrixA: str
    matrixB: str | None = None
    matrixC: str | None = None
    rhs: str | None = None
    k: int | None = None
    mods: Mods | None = None
    output: OutputMode = "exact"


class MatrixBlock(BaseModel):
    kind: Literal["matrix"] = "matrix"
    label: str
    latex: str
    raw: str
    note: str | None = None


class ScalarBlock(BaseModel):
    kind: Literal["scalar"] = "scalar"
    label: str
    latex: str


class VectorItem(BaseModel):
    label: str
    latex: str
    raw: str


class VectorListBlock(BaseModel):
    kind: Literal["vectorList"] = "vectorList"
    label: str
    items: list[VectorItem]


ResultBlock = MatrixBlock | ScalarBlock | VectorListBlock


class Step(BaseModel):
    n: int
    descriptionLatex: str
    matrixLatex: str | None = None
    changedRows: list[int] | None = None


class ComputeResponse(BaseModel):
    operation: str
    blocks: list[ResultBlock]
    steps: list[Step] = Field(default_factory=list)


class ErrorDetail(BaseModel):
    code: Literal["parse", "compute", "timeout"]
    message: str
    cell: dict[str, int] | None = None


class ComputeError(BaseModel):
    error: ErrorDetail
