"""add photo_url to profiles

Revision ID: 008_add_photo_url
Revises: 007_gender_not_null
Create Date: 2026-05-23
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "008_add_photo_url"
down_revision = "007_gender_not_null"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("photo_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("profiles", "photo_url")
