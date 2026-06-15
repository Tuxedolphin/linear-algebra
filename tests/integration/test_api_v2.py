import pytest

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


ALL_OPS = {
    "ref",
    "rref",
    "det",
    "inv",
    "rank",
    "lu",
    "qr",
    "svd",
    "gram_schmidt",
    "eigenvals",
    "eigenvects",
    "diagonalize",
    "orth_diagonalize",
    "nullspace",
    "colspace",
    "orth_complement",
    "col_constraints",
    "extend_basis",
    "solve",
    "least_squares",
    "projection",
    "intersect",
    "transition",
    "markov_steady",
    "markov_kstep",
    "eval_cases",
    "find_cases",
    "chain_multiply",
}


def test_registry_covers_every_operation():
    from app.operations import OP_REGISTRY

    assert set(OP_REGISTRY.keys()) == ALL_OPS


def test_rref_single_matrix_block():
    from app.operations import run_operation
    from app.schemas import ComputeRequest

    resp = run_operation(
        ComputeRequest(operation="rref", matrixA="[1 2; 3 4]", output="exact")
    )

    assert resp.operation == "rref"
    assert len(resp.blocks) == 1
    assert resp.blocks[0].kind == "matrix"
    assert resp.blocks[0].label == "RREF"
    assert resp.blocks[0].raw == "[1 0; 0 1]"


def test_qr_returns_multiple_matrix_blocks():
    from app.operations import run_operation
    from app.schemas import ComputeRequest

    resp = run_operation(
        ComputeRequest(operation="qr", matrixA="[1 0; 0 1]", output="exact")
    )

    assert [block.label for block in resp.blocks] == ["Q", "R"]
    assert all(block.kind == "matrix" for block in resp.blocks)


def test_changed_rows_highlights_both_rows_of_a_swap():
    from app.steps import _changed_rows_from_description

    assert _changed_rows_from_description(r"R_1 \leftrightarrow R_2") == [0, 1]
    # A scale/add operation only changes its arrow target.
    assert _changed_rows_from_description(r"R_2 - \left(3\right)R_1 \rightarrow R_2") == [1]
    assert _changed_rows_from_description("no rows here") is None


def test_solve_inconsistent_system_keeps_working_steps():
    from app.operations import run_operation
    from app.schemas import ComputeRequest

    # x + y = 1 and x + y = 2 is inconsistent: the library prints its RREF
    # working before raising, and that working must still reach the response.
    resp = run_operation(
        ComputeRequest(operation="solve", matrixA="[1 1; 1 1]", rhs="[1; 2]", output="exact")
    )

    assert resp.blocks[0].label == "Solution"
    assert "No solution" in resp.blocks[0].latex
    assert len(resp.steps) >= 1


def test_markov_kstep_blocks_follow_step_order():
    from app.operations import run_operation
    from app.schemas import ComputeRequest

    resp = run_operation(
        ComputeRequest(
            operation="markov_kstep",
            matrixA="[1/2 1/2; 1/2 1/2]",
            rhs="[1; 0]",
            k=2,
            output="exact",
        )
    )

    # A^k is derived first in the steps, so it must be the first result block.
    assert [block.label for block in resp.blocks] == ["A^2", "x_2"]


def test_compute_v2_endpoint_returns_structured_response():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.post(
        "/api/v2/compute",
        json={"operation": "rref", "matrixA": "[1 2; 3 4]", "output": "exact"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["operation"] == "rref"
    assert data["blocks"][0]["kind"] == "matrix"
    assert data["blocks"][0]["raw"] == "[1 0; 0 1]"


def test_compute_endpoint_parse_error_returns_400_with_parse_code():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.post(
        "/api/v2/compute",
        json={"operation": "rref", "matrixA": "[sqrt(2; 1]", "output": "exact"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "parse"


def test_parse_endpoint_returns_grid():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.post("/api/v2/parse", json={"matrix": "[1 sqrt(2); 3 4]"})

    assert response.status_code == 200
    body = response.json()
    assert body["rows"] == 2
    assert body["cols"] == 2
    assert body["cells"][0][1] == "sqrt(2)"


def test_equivalent_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.post("/api/v2/equivalent", json={"matrix": "[1 0; 0 1]"})

    assert response.status_code == 200
    assert "statements" in response.json()


OP_FIXTURES = {
    "ref": {"matrixA": "[2 1 -1; 4 3 2; -2 0 5]"},
    "rref": {"matrixA": "[1 2; 3 4]"},
    "det": {"matrixA": "[1 2; 3 4]"},
    "inv": {"matrixA": "[1 2; 3 5]"},
    "rank": {"matrixA": "[1 2; 2 4]"},
    "lu": {"matrixA": "[2 1; 4 3]"},
    "qr": {"matrixA": "[1 1; 1 0; 0 1]"},
    "svd": {"matrixA": "[1 0; 0 2]"},
    "gram_schmidt": {"matrixA": "[1 1; 1 0; 0 1]"},
    "eigenvals": {"matrixA": "[2 0; 0 3]"},
    "eigenvects": {"matrixA": "[2 0; 0 3]"},
    "diagonalize": {"matrixA": "[2 0; 0 3]"},
    "orth_diagonalize": {"matrixA": "[2 1; 1 2]"},
    "nullspace": {"matrixA": "[1 2; 2 4]"},
    "colspace": {"matrixA": "[1 2; 2 4]"},
    "orth_complement": {"matrixA": "[1 0; 0 1; 0 0]"},
    "col_constraints": {"matrixA": "[1 2; 2 4]"},
    "extend_basis": {"matrixA": "[1; 0; 0]"},
    "solve": {"matrixA": "[1 1; 0 1]", "rhs": "[2; 1]"},
    "least_squares": {"matrixA": "[1 1; 1 0; 0 1]", "rhs": "[1; 2; 3]"},
    "projection": {"matrixA": "[1 1; 1 0; 0 1]", "rhs": "[1; 2; 3]"},
    "intersect": {"matrixA": "[1 0; 0 1; 0 0]", "matrixB": "[1 0; 0 0; 0 1]"},
    "transition": {"matrixA": "[1 0; 0 1]", "matrixB": "[1 1; 0 1]"},
    "markov_steady": {"matrixA": "[1/2 1/2; 1/2 1/2]"},
    "markov_kstep": {"matrixA": "[1/2 1/2; 1/2 1/2]", "rhs": "[1; 0]", "k": 3},
    "eval_cases": {"matrixA": "[1 a; 0 1]"},
    "find_cases": {"matrixA": "[1 a; 0 1]"},
    "chain_multiply": {
        "matrixA": "[1 2; 3 4]",
        "matrixB": "[1 0; 0 1]",
        "mods": {"m1": "none", "m2": "none"},
    },
}


@pytest.mark.parametrize("op", sorted(OP_FIXTURES))
def test_every_operation_returns_200_with_blocks(op):
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    payload = {"operation": op, "output": "exact", **OP_FIXTURES[op]}
    response = client.post("/api/v2/compute", json=payload)

    assert response.status_code == 200, response.text
    assert len(response.json()["blocks"]) >= 1
