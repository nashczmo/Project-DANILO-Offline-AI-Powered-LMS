"""deped alignment

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-28 12:35:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    if 'courses' in inspector.get_table_names():
        columns = {column['name'] for column in inspector.get_columns('courses')}
        if 'quarter' in columns:
            try:
                conn.execute(text('ALTER TABLE courses RENAME COLUMN quarter TO term'))
            except Exception as e:
                pass # Already renamed or unsupported
                
    if 'modules' in inspector.get_table_names():
        columns = {column['name'] for column in inspector.get_columns('modules')}
        if 'quarter' in columns:
            try:
                conn.execute(text('ALTER TABLE modules RENAME COLUMN quarter TO term'))
            except Exception as e:
                pass
                
    if 'grade_entries' in inspector.get_table_names():
        columns = {column['name'] for column in inspector.get_columns('grade_entries')}
        if 'quarter' in columns:
            try:
                conn.execute(text('ALTER TABLE grade_entries RENAME COLUMN quarter TO term'))
            except Exception as e:
                pass

def downgrade() -> None:
    pass
