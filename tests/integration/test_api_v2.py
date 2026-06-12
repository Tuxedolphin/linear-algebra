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


def test_parse_handles_algebra_and_irrationals():
    from app.parse import parse_input
    import sympy as sym

    m = parse_input("[1/2 sqrt(2) pi; 2*x+1 -3/7 E; 0 I 5^(1/3)]")

    assert m.shape == (3, 3)
    assert m[0, 1] == sym.sqrt(2)
    assert m[0, 2] == sym.pi


def test_parse_raises_on_unbalanced():
    from app.parse import parse_input
    import pytest

    with pytest.raises(ValueError):
        parse_input("[sqrt(2; 1]")


def test_to_raw_roundtrips():
    from app.parse import parse_input, to_raw

    m = parse_input("[1 0; 0 1]")

    assert parse_input(to_raw(m)).equals(m)


def test_to_bmatrix_is_katex_ready():
    from app.parse import parse_input, to_bmatrix

    m = parse_input("[1 2; 3 4]")
    s = to_bmatrix(m)

    assert s.startswith("\\begin{bmatrix}") and s.endswith("\\end{bmatrix}")


def test_capture_steps_for_ref_returns_structured():
    from app.parse import parse_input
    from app.steps import capture_steps

    A = parse_input("[2 1 -1; 4 3 2; -2 0 5]")
    steps = capture_steps(lambda: A.ref(verbosity=2))

    assert len(steps) >= 1
    first = steps[0]
    assert first.n == 1
    assert isinstance(first.descriptionLatex, str) and first.descriptionLatex
    assert any(step.matrixLatex for step in steps)
