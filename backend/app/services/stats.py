from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas import StatsOut

_WINDOW = "NOW() - INTERVAL '30 days'"


def compute_user_stats(db: Session, user_id: int) -> StatsOut:
    total_swipes = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :uid AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    smashes_received = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE target_user_id = :uid "
            f"AND direction = 'smash' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    total_matches = db.execute(
        text(
            f"SELECT COUNT(*) FROM matches "
            f"WHERE (user_low_id = :uid OR user_high_id = :uid) "
            f"AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    avg_messages = db.execute(
        text(f"""
            SELECT AVG(msg_count) FROM (
                SELECT m.id, COUNT(msg.id) AS msg_count
                FROM matches m
                JOIN messages msg ON msg.match_id = m.id
                WHERE (m.user_low_id = :uid OR m.user_high_id = :uid)
                  AND msg.created_at >= {_WINDOW}
                GROUP BY m.id
            ) sub
        """),
        {"uid": user_id},
    ).scalar()

    smashes_made = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :uid "
            f"AND direction = 'smash' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    passes_made = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE swiper_user_id = :uid "
            f"AND direction = 'pass' "
            f"AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    successful_smashes = db.execute(
        text(f"""
            SELECT COUNT(*)
            FROM swipes s
            WHERE s.swiper_user_id = :uid
              AND s.direction = 'smash'
              AND s.created_at >= {_WINDOW}
              AND EXISTS (
                  SELECT 1
                  FROM matches m
                  WHERE
                    (m.user_low_id = :uid AND m.user_high_id = s.target_user_id)
                    OR
                    (m.user_high_id = :uid AND m.user_low_id = s.target_user_id)
              )
        """),
        {"uid": user_id},
    ).scalar() or 0

    total_swipes_received = db.execute(
        text(
            f"SELECT COUNT(*) FROM swipes "
            f"WHERE target_user_id = :uid AND created_at >= {_WINDOW}"
        ),
        {"uid": user_id},
    ).scalar() or 0

    smash_success_rate = (
        successful_smashes / smashes_made * 100 if smashes_made > 0 else None
    )
    incoming_interest_rate = (
        smashes_received / total_swipes_received * 100
        if total_swipes_received > 0
        else None
    )
    hard_to_get_rate = (
        passes_made / total_swipes * 100 if total_swipes > 0 else None
    )

    return StatsOut(
        total_swipes_made=total_swipes,
        smashes_received=smashes_received,
        total_matches=total_matches,
        avg_messages_per_match=float(avg_messages) if avg_messages is not None else None,
        smashes_made=smashes_made,
        passes_made=passes_made,
        smash_success_rate=float(smash_success_rate) if smash_success_rate is not None else None,
        incoming_interest_rate=(
            float(incoming_interest_rate) if incoming_interest_rate is not None else None
        ),
        hard_to_get_rate=float(hard_to_get_rate) if hard_to_get_rate is not None else None,
    )
