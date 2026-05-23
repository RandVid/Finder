"""Make profiles.gender NOT NULL.

Revision ID: 007_gender_not_null
Revises: 006_add_country
Create Date: 2026-05-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007_gender_not_null"
down_revision: Union[str, None] = "006_add_country"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

profile_gender = postgresql.ENUM(
    "woman", "man", "nonbinary", name="profile_gender", create_type=False
)


def upgrade() -> None:
    op.execute("UPDATE profiles SET gender = 'man' WHERE gender IS NULL")
    op.alter_column("profiles", "gender", existing_type=profile_gender, nullable=False)


def downgrade() -> None:
    op.alter_column("profiles", "gender", existing_type=profile_gender, nullable=True)
