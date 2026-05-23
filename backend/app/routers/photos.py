from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Profile, User

router = APIRouter()

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
STATIC_DIR = Path(__file__).resolve().parents[2] / "static" / "photos"

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/me/photo")
async def upload_photo(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    ext = (file.filename or "photo").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"

    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{current_user.id}.{ext}"
    (STATIC_DIR / filename).write_bytes(await file.read())

    photo_url = f"{BASE_URL}/static/photos/{filename}"

    profile = db.get(Profile, current_user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    profile.photo_url = photo_url
    db.commit()

    return {"photo_url": photo_url}
