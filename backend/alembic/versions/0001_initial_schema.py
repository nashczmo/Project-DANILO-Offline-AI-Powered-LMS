"""Initial schema – create all Project DANILO tables.

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tables are created by SQLAlchemy Base.metadata.create_all() on startup.
    # This migration is a no-op marker so that Alembic tracks the baseline.
    pass


def downgrade() -> None:
    pass
