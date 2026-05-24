"""Add image_url to messages for photo attachments.

Revision ID: 009_message_image_url
Revises: 008_add_photo_url
Create Date: 2026-05-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009_message_image_url"
down_revision: Union[str, None] = "008_add_photo_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("image_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "image_url")
