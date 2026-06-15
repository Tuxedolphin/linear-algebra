from fastapi import FastAPI

from app.api_v2 import router as api_v2_router


app = FastAPI()
app.include_router(api_v2_router)
