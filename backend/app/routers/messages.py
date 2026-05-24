from __future__ import annotations

import os
import time
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Match, Message, User
from app.schemas import MessageOut, MessageRequest

router = APIRouter()

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
CHAT_DIR = Path(__file__).resolve().parents[2] / "static" / "chat"
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_match_or_403(match_id: int, user_id: int, db: Session) -> Match:
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    if user_id not in (match.user_low_id, match.user_high_id):
        raise HTTPException(403, "Not a participant of this match")
    return match


@router.get("/matches/{match_id}/messages", response_model=list[MessageOut])
def list_messages(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_match_or_403(match_id, current_user.id, db)
    return (
        db.query(Message)
        .filter_by(match_id=match_id)
        .order_by(Message.created_at)
        .all()
    )


@router.post("/matches/{match_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    match_id: int,
    body: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_match_or_403(match_id, current_user.id, db)
    text = body.body.strip()
    if not text:
        raise HTTPException(400, "Message body cannot be empty")
    msg = Message(match_id=match_id, sender_user_id=current_user.id, body=text)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/matches/{match_id}/messages/photo", response_model=MessageOut, status_code=201)
async def send_message_photo(
    match_id: int,
    file: UploadFile,
    caption: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_match_or_403(match_id, current_user.id, db)

    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are allowed")

    ext = (file.filename or "photo").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        ext = "jpg"

    CHAT_DIR.mkdir(parents=True, exist_ok=True)
    match_dir = CHAT_DIR / str(match_id)
    match_dir.mkdir(exist_ok=True)
    filename = f"{int(time.time() * 1000)}_{current_user.id}.{ext}"
    (match_dir / filename).write_bytes(await file.read())

    image_url = f"{BASE_URL}/static/chat/{match_id}/{filename}"
    msg = Message(
        match_id=match_id,
        sender_user_id=current_user.id,
        body=caption.strip(),
        image_url=image_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
