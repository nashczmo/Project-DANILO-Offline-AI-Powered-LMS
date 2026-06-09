"""add grading_period column to grade_entries

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-08 14:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    is_postgres = conn.dialect.name == 'postgresql'

    if 'grade_entries' not in inspector.get_table_names():
        return

    # Check if column already exists
    existing_columns = [col['name'] for col in inspector.get_columns('grade_entries')]
    if 'grading_period' in existing_columns:
        return

    # 1. Add the column with a default value
    op.add_column('grade_entries', sa.Column('grading_period', sa.String(10), nullable=False, server_default='Midterm'))

    # 2. Backfill existing rows based on component name heuristics
    conn.execute(text("""
        UPDATE grade_entries
        SET grading_period = 'Endterm'
        WHERE lower(component) LIKE '%end term%'
           OR lower(component) LIKE '%endterm%'
           OR lower(component) LIKE '%final exam%'
           OR lower(component) LIKE '%final assessment%'
    """))

    # All other rows remain 'Midterm' (the default)

    # 3. Add the check constraint (PostgreSQL only)
    if is_postgres:
        try:
            conn.execute(text(
                "ALTER TABLE grade_entries ADD CONSTRAINT ck_grade_entries_grading_period "
                "CHECK (grading_period IN ('Midterm', 'Endterm'))"
            ))
        except Exception:
            pass  # Constraint may already exist


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    is_postgres = conn.dialect.name == 'postgresql'

    existing_columns = [col['name'] for col in inspector.get_columns('grade_entries')]
    if 'grading_period' not in existing_columns:
        return

    if is_postgres:
        try:
            conn.execute(text('ALTER TABLE grade_entries DROP CONSTRAINT ck_grade_entries_grading_period'))
        except Exception:
            pass

    op.drop_column('grade_entries', 'grading_period')
