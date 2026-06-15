from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_allows_configured_origin(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://studio.example.com")

    client = TestClient(create_app())
    response = client.options(
        "/api/v2/compute",
        headers={
            "Origin": "https://studio.example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://studio.example.com"


def test_cors_rejects_unconfigured_origin(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://studio.example.com")

    client = TestClient(create_app())
    response = client.options(
        "/api/v2/compute",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
