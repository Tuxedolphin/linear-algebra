import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api_v2 import router as api_v2_router


def _allowed_origins() -> list[str]:
    return [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    ]


def create_app() -> FastAPI:
    app = FastAPI()
    origins = _allowed_origins()

    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=["POST"],
            allow_headers=["Content-Type"],
        )

    app.include_router(api_v2_router)
    return app


app = create_app()
