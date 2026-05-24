"""Add country column to profiles.

Revision ID: 006_add_country
Revises: 005_fix_missing_tables
Create Date: 2026-05-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_add_country"
down_revision: Union[str, None] = "005_fix_missing_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("country", sa.String(120), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "country")
