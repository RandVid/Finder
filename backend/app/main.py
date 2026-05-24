from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

# Repo root .env (not backend/) — same layout as seed script and docker-compose.
_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, discovery, matches, messages, photos, profiles, stats, swipes

app = FastAPI(title="Finder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
_STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
app.include_router(photos.router, prefix="/profiles", tags=["profiles"])
app.include_router(discovery.router, prefix="/discovery", tags=["discovery"])
app.include_router(swipes.router, prefix="/swipes", tags=["swipes"])
app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(messages.router, tags=["messages"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
