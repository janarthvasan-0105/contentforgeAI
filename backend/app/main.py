import os
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import router
from app.api.billing import router as billing_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(title="ContentForge AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(billing_router, prefix="/api")

# Serve rendered post PNGs (Legacy)
rendered_dir = os.path.join(os.path.dirname(__file__), "render", "output")
os.makedirs(rendered_dir, exist_ok=True)
app.mount("/rendered", StaticFiles(directory=rendered_dir), name="rendered")

# Serve new outputs (Gemini images, Runway videos)
outputs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs")
os.makedirs(outputs_dir, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=outputs_dir), name="outputs")
