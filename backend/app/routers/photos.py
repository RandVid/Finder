from __future__ import annotations

import os
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Profile, User

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Cloudinary is configured from env vars; fall back to local static serving if not set.
_USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_CLOUD_NAME"))

if _USE_CLOUDINARY:
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )

# Local fallback (dev)
_BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
_STATIC_DIR = Path(__file__).resolve().parents[2] / "static" / "photos"


@router.post("/me/photo")
async def upload_photo(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    data = await file.read()

    if _USE_CLOUDINARY:
        result = cloudinary.uploader.upload(
            data,
            public_id=f"finder/profiles/{current_user.id}",
            overwrite=True,
            resource_type="image",
        )
        photo_url = result["secure_url"]
    else:
        ext = (file.filename or "photo").rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        _STATIC_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{current_user.id}.{ext}"
        (_STATIC_DIR / filename).write_bytes(data)
        photo_url = f"/static/photos/{filename}"

    profile = db.get(Profile, current_user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    profile.photo_url = photo_url
    db.commit()

    return {"photo_url": photo_url}
