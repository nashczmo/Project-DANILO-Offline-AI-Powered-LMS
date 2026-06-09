"""fix constraints

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-08 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    is_postgres = conn.dialect.name == 'postgresql'
    
    # 1. Courses Table
    if 'courses' in inspector.get_table_names():
        # Update existing data to match the new Term format
        conn.execute(text("UPDATE courses SET term = REPLACE(term, 'Quarter', 'Term') WHERE term LIKE 'Quarter%'"))
        
        if is_postgres:
            # Drop the old constraints. The name could be ck_courses_quarter or ck_courses_term from the 0001 schema.
            try:
                conn.execute(text('ALTER TABLE courses DROP CONSTRAINT ck_courses_quarter'))
            except Exception:
                pass
            try:
                conn.execute(text('ALTER TABLE courses DROP CONSTRAINT ck_courses_term'))
            except Exception:
                pass
            
            # Add the new constraint
            try:
                conn.execute(text("ALTER TABLE courses ADD CONSTRAINT ck_courses_term CHECK (term IN ('Term 1', 'Term 2', 'Term 3'))"))
            except Exception:
                pass
            
    # 2. Modules Table
    if 'modules' in inspector.get_table_names():
        conn.execute(text("UPDATE modules SET term = REPLACE(term, 'Quarter', 'Term') WHERE term LIKE 'Quarter%'"))
        
        if is_postgres:
            try:
                conn.execute(text('ALTER TABLE modules DROP CONSTRAINT ck_modules_quarter'))
            except Exception:
                pass
            try:
                conn.execute(text('ALTER TABLE modules DROP CONSTRAINT ck_modules_term'))
            except Exception:
                pass
            
            try:
                conn.execute(text("ALTER TABLE modules ADD CONSTRAINT ck_modules_term CHECK (term IN ('Term 1', 'Term 2', 'Term 3'))"))
            except Exception:
                pass
            
    # 3. Grade Entries Table
    if 'grade_entries' in inspector.get_table_names():
        conn.execute(text("UPDATE grade_entries SET term = REPLACE(term, 'Quarter', 'Term') WHERE term LIKE 'Quarter%'"))
        
        if is_postgres:
            try:
                conn.execute(text('ALTER TABLE grade_entries DROP CONSTRAINT ck_grade_entries_quarter'))
            except Exception:
                pass
            try:
                conn.execute(text('ALTER TABLE grade_entries DROP CONSTRAINT ck_grade_entries_term'))
            except Exception:
                pass
            
            try:
                conn.execute(text("ALTER TABLE grade_entries ADD CONSTRAINT ck_grade_entries_term CHECK (term IN ('Term 1', 'Term 2', 'Term 3'))"))
            except Exception:
                pass

def downgrade() -> None:
    pass
