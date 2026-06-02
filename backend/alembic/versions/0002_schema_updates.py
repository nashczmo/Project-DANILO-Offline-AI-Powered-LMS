"""schema updates extracted from main.py

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-28 11:32:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    if 'users' not in inspector.get_table_names():
        return
        
    columns = {column['name'] for column in inspector.get_columns('users')}
    
    if 'password_hash' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)'))
    if 'password_salt' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN password_salt VARCHAR(255) DEFAULT ''"))
    if 'role' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student' NOT NULL"))
    if 'email' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN email VARCHAR(255)'))
    if 'full_name' not in columns:
        conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT 'Project DANILO User' NOT NULL"))
    if 'education_level' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN education_level VARCHAR(40)'))
    if 'grade_level' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN grade_level VARCHAR(50)'))
    if 'strand' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN strand VARCHAR(80)'))
    if 'section_name' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN section_name VARCHAR(120)'))
    if 'is_active' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL'))
    if 'created_at' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL'))
        
    course_columns = {column['name'] for column in inspector.get_columns('courses')} if 'courses' in inspector.get_table_names() else set()
    module_columns = {column['name'] for column in inspector.get_columns('modules')} if 'modules' in inspector.get_table_names() else set()
    user_columns = {column['name'] for column in inspector.get_columns('users')} if 'users' in inspector.get_table_names() else set()
    
    if 'courses' in inspector.get_table_names() and 'teacher_id' in course_columns:
        conn.execute(text('ALTER TABLE courses ALTER COLUMN teacher_id DROP NOT NULL'))
    if 'courses' in inspector.get_table_names() and 'is_active' not in course_columns:
        conn.execute(text('ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL'))
    if 'courses' in inspector.get_table_names() and 'education_level' not in course_columns:
        conn.execute(text("ALTER TABLE courses ADD COLUMN education_level VARCHAR(40) DEFAULT 'Junior High School' NOT NULL"))
    if 'courses' in inspector.get_table_names() and 'strand' not in course_columns:
        conn.execute(text('ALTER TABLE courses ADD COLUMN strand VARCHAR(80)'))
    if 'courses' in inspector.get_table_names() and 'department_id' not in course_columns:
        conn.execute(text('ALTER TABLE courses ADD COLUMN department_id VARCHAR(36) REFERENCES departments(id)'))
    if 'modules' in inspector.get_table_names() and 'file_url' not in module_columns:
        conn.execute(text('ALTER TABLE modules ADD COLUMN file_url VARCHAR(500)'))
    if 'modules' in inspector.get_table_names() and 'content' not in module_columns:
        conn.execute(text('ALTER TABLE modules ADD COLUMN content TEXT'))
    if 'modules' in inspector.get_table_names() and 'learning_competency' not in module_columns:
        conn.execute(text('ALTER TABLE modules ADD COLUMN learning_competency TEXT'))
    if 'modules' in inspector.get_table_names() and 'lesson_objectives' not in module_columns:
        conn.execute(text('ALTER TABLE modules ADD COLUMN lesson_objectives TEXT'))
    if 'modules' in inspector.get_table_names() and 'assessment_type' not in module_columns:
        conn.execute(text('ALTER TABLE modules ADD COLUMN assessment_type VARCHAR(120)'))
    if 'users' in inspector.get_table_names() and 'department_id' not in user_columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN department_id VARCHAR(36) REFERENCES departments(id)'))
    if 'users' in inspector.get_table_names() and 'force_password_change' not in user_columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT false NOT NULL'))
        
    submission_columns = {column['name'] for column in inspector.get_columns('submissions')} if 'submissions' in inspector.get_table_names() else set()
    if 'submissions' in inspector.get_table_names() and 'score' not in submission_columns:
        conn.execute(text('ALTER TABLE submissions ADD COLUMN score FLOAT'))
    if 'submissions' in inspector.get_table_names() and 'feedback' not in submission_columns:
        conn.execute(text('ALTER TABLE submissions ADD COLUMN feedback TEXT'))
        
    profile_columns = {column['name'] for column in inspector.get_columns('student_ai_profiles')} if 'student_ai_profiles' in inspector.get_table_names() else set()
    if 'student_ai_profiles' in inspector.get_table_names():
        for column_name, ddl in {'strengths_json': "ALTER TABLE student_ai_profiles ADD COLUMN strengths_json TEXT DEFAULT '[]' NOT NULL", 'weak_concepts_json': "ALTER TABLE student_ai_profiles ADD COLUMN weak_concepts_json TEXT DEFAULT '[]' NOT NULL", 'learning_trends_json': "ALTER TABLE student_ai_profiles ADD COLUMN learning_trends_json TEXT DEFAULT '[]' NOT NULL", 'recommendations_json': "ALTER TABLE student_ai_profiles ADD COLUMN recommendations_json TEXT DEFAULT '[]' NOT NULL", 'quiz_summary_json': "ALTER TABLE student_ai_profiles ADD COLUMN quiz_summary_json TEXT DEFAULT '{}' NOT NULL", 'assignment_summary_json': "ALTER TABLE student_ai_profiles ADD COLUMN assignment_summary_json TEXT DEFAULT '{}' NOT NULL", 'ai_interaction_count': 'ALTER TABLE student_ai_profiles ADD COLUMN ai_interaction_count INTEGER DEFAULT 0 NOT NULL', 'last_interaction_at': 'ALTER TABLE student_ai_profiles ADD COLUMN last_interaction_at TIMESTAMPTZ', 'updated_at': 'ALTER TABLE student_ai_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL'}.items():
            if column_name not in profile_columns:
                conn.execute(text(ddl))
                
    assignment_questions_columns = {column['name'] for column in inspector.get_columns('assignment_questions')} if 'assignment_questions' in inspector.get_table_names() else set()
    if 'assignment_questions' in inspector.get_table_names() and 'section_name' not in assignment_questions_columns:
        conn.execute(text('ALTER TABLE assignment_questions ADD COLUMN section_name VARCHAR(120)'))
        
    if 'audit_logs' in inspector.get_table_names():
        audit_cols = inspector.get_columns('audit_logs')
        for col in audit_cols:
            if col['name'] == 'entity_id' and not str(col['type']).startswith('VARCHAR'):
                conn.execute(text('ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(36) USING entity_id::character varying'))


def downgrade() -> None:
    pass
