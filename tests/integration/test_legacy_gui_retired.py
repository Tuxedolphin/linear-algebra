from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_legacy_process_endpoint_is_retired():
    response = client.post(
        "/api/process",
        json={"matrix": "[[1, 2], [3, 4]]", "operation": "rref"},
    )

    assert response.status_code == 404


def test_legacy_parse_endpoint_is_retired():
    response = client.post("/api/parse", json={"matrix": "[1 2; 3 4]"})

    assert response.status_code == 404


def test_legacy_equivalent_endpoint_is_retired():
    response = client.post("/api/equivalent", json={"matrix": "[1 0; 0 1]"})

    assert response.status_code == 404


def test_legacy_root_html_is_not_served_by_backend():
    response = client.get("/")

    assert response.status_code == 404


def test_legacy_static_assets_are_not_mounted():
    response = client.get("/static/style.css")

    assert response.status_code == 404
