from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import StatsOut

router = APIRouter()

_WINDOW = "NOW() - INTERVAL '30 days'"


@router.get("/me", response_model=StatsOut)
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    me = current_user.id

    total_swipes = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :me AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    smashes_received = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE target_user_id = :me "
            f"AND direction = 'smash' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    total_matches = db.execute(
        text(
            f"SELECT COUNT(*) FROM matches "
            f"WHERE (user_low_id = :me OR user_high_id = :me) "
            f"AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    avg_messages = db.execute(
        text(f"""
            SELECT AVG(msg_count) FROM (
                SELECT m.id, COUNT(msg.id) AS msg_count
                FROM matches m
                JOIN messages msg ON msg.match_id = m.id
                WHERE (m.user_low_id = :me OR m.user_high_id = :me)
                  AND msg.created_at >= {_WINDOW}
                GROUP BY m.id
            ) sub
        """),
        {"me": me},
    ).scalar()

    smashes_made = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :me "
            f"AND direction = 'smash' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    passes_made = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :me "
            f"AND direction = 'pass' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    successful_smashes = db.execute(
        text(f"""
            SELECT COUNT(*)
            FROM swipes s
            WHERE s.swiper_user_id = :me
              AND s.direction = 'smash'
              AND s.created_at >= {_WINDOW}
              AND EXISTS (
                  SELECT 1
                  FROM matches m
                  WHERE
                    (m.user_low_id = :me AND m.user_high_id = s.target_user_id)
                    OR
                    (m.user_high_id = :me AND m.user_low_id = s.target_user_id)
              )
        """),
        {"me": me},
    ).scalar() or 0

    total_swipes_received = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE target_user_id = :me AND created_at >= {_WINDOW}"
        ),
        {"me": me},
    ).scalar() or 0

    smash_success_rate = (
        successful_smashes / smashes_made * 100
        if smashes_made > 0
        else None
    )

    incoming_interest_rate = (
        smashes_received / total_swipes_received * 100
        if total_swipes_received > 0
        else None
    )

    hard_to_get_rate = (
        passes_made / total_swipes * 100
        if total_swipes > 0
        else None
    )

    return StatsOut(
        total_swipes_made=total_swipes,
        smashes_received=smashes_received,
        total_matches=total_matches,
        avg_messages_per_match=float(avg_messages) if avg_messages is not None else None,
        smashes_made=smashes_made,
        passes_made=passes_made,
        smash_success_rate=float(smash_success_rate) if smash_success_rate is not None else None,
        incoming_interest_rate=float(incoming_interest_rate) if incoming_interest_rate is not None else None,
        hard_to_get_rate=float(hard_to_get_rate) if hard_to_get_rate is not None else None,
    )