from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from app.main import create_app as create_api_app


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STATIC_DIR = PROJECT_ROOT / "frontend" / "dist"
MISSING_FRONTEND_DETAIL = (
    "Offline frontend build not found. The exam launcher cannot install "
    "dependencies or build assets."
)


def _safe_static_file(static_dir: Path, request_path: str) -> Path | None:
    if not request_path or request_path.endswith("/"):
        return None

    static_root = static_dir.resolve()
    candidate = (static_root / request_path).resolve()

    try:
        candidate.relative_to(static_root)
    except ValueError:
        return None

    if candidate.is_file():
        return candidate
    return None


def create_app(static_dir: Path = DEFAULT_STATIC_DIR) -> FastAPI:
    app = create_api_app()
    index_html = static_dir / "index.html"

    def _require_index_html() -> Path:
        if not index_html.is_file():
            raise HTTPException(status_code=503, detail=MISSING_FRONTEND_DETAIL)
        return index_html

    @app.get("/")
    async def serve_index():
        return FileResponse(_require_index_html())

    @app.get("/{request_path:path}")
    async def serve_frontend(request_path: str):
        if request_path.startswith("api/"):
            raise HTTPException(status_code=404)

        _require_index_html()

        static_file = _safe_static_file(static_dir, request_path)
        if static_file is not None:
            return FileResponse(static_file)

        return FileResponse(index_html)

    return app


app = create_app()
