from app.schemas import ComputeRequest, ComputeResponse, MatrixBlock, Step


def test_schema_roundtrip():
    req = ComputeRequest(operation="rref", matrixA="[1 2; 3 4]", output="exact")
    assert req.operation == "rref"

    resp = ComputeResponse(
        operation="rref",
        blocks=[
            MatrixBlock(
                label="RREF",
                latex="\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}",
                raw="[1 0; 0 1]",
            )
        ],
        steps=[Step(n=1, descriptionLatex="R_1", matrixLatex=None, changedRows=[0])],
    )

    assert resp.blocks[0].kind == "matrix"
    assert resp.model_dump(by_alias=True)["steps"][0]["descriptionLatex"] == "R_1"
