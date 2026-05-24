from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import StatsOut
from app.services.stats import compute_user_stats

router = APIRouter()


@router.get("/me", response_model=StatsOut)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_user_stats(db, current_user.id)
