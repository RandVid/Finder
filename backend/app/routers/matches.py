from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import Match, Message, Profile, User
from app.routers.profiles import _profile_out
from app.schemas import MatchOut, ProfileOut

router = APIRouter()


def _get_match_for_user(match_id: int, user_id: int, db: Session) -> Match:
    match = db.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    if user_id not in (match.user_low_id, match.user_high_id):
        raise HTTPException(403, "Not a participant of this match")
    return match


@router.get("", response_model=list[MatchOut])
def list_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    matches = (
        db.query(Match)
        .filter(
            or_(Match.user_low_id == current_user.id, Match.user_high_id == current_user.id)
        )
        .order_by(Match.created_at.desc())
        .all()
    )

    result = []
    for m in matches:
        other_id = m.user_high_id if m.user_low_id == current_user.id else m.user_low_id
        other_profile = db.get(Profile, other_id)
        last = (
            db.query(Message)
            .filter_by(match_id=m.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        result.append(
            MatchOut(
                id=m.id,
                other_user_id=other_id,
                other_display_name=other_profile.display_name if other_profile else None,
                other_photo_url=other_profile.photo_url if other_profile else None,
                created_at=m.created_at,
                last_message_body=last.body if last and last.body.strip() else None,
                last_message_at=last.created_at if last else None,
                last_message_image_url=last.image_url if last else None,
            )
        )

    result.sort(
        key=lambda x: x.last_message_at or x.created_at,
        reverse=True,
    )
    return result


@router.get("/{match_id}/profile", response_model=ProfileOut)
def get_match_partner_profile(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Public profile of your match partner — only if you are in this match."""
    match = _get_match_for_user(match_id, current_user.id, db)
    other_id = (
        match.user_high_id
        if match.user_low_id == current_user.id
        else match.user_low_id
    )
    profile = db.get(Profile, other_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return _profile_out(profile, db)
