from fastapi.testclient import TestClient

from app.local_exam import create_app


def _write_frontend_dist(tmp_path):
    assets = tmp_path / "assets"
    assets.mkdir()
    (tmp_path / "index.html").write_text("<html><body>offline app</body></html>")
    (assets / "app.js").write_text("console.log('offline app')")


def test_local_exam_app_serves_frontend_and_api(tmp_path):
    _write_frontend_dist(tmp_path)
    client = TestClient(create_app(tmp_path))

    assert client.get("/").text == "<html><body>offline app</body></html>"
    assert client.get("/calculator").text == "<html><body>offline app</body></html>"
    assert client.get("/assets/app.js").text == "console.log('offline app')"
    assert client.get("/api/v2/health").status_code == 200


def test_local_exam_app_keeps_unknown_api_routes_as_404(tmp_path):
    _write_frontend_dist(tmp_path)
    client = TestClient(create_app(tmp_path))

    response = client.get("/api/missing")

    assert response.status_code == 404


def test_local_exam_app_reports_missing_frontend_build(tmp_path):
    client = TestClient(create_app(tmp_path))

    response = client.get("/")

    assert response.status_code == 503
    assert "cannot install dependencies or build assets" in response.json()["detail"]
