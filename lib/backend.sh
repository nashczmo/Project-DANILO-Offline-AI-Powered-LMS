# Project DANILO installer module: backend.sh

write_backend_files() {
  mkdir -p "${APP_ROOT}/backend/app" "${CONTENT_ROOT}"

  cat > "${APP_ROOT}/backend/requirements.txt" <<'EOF'
fastapi==0.115.12
uvicorn[standard]==0.34.2
sqlalchemy==2.0.40
alembic==1.14.0
psycopg[binary]==3.2.6
PyJWT==2.10.1
httpx==0.28.1
pydantic[email]==2.11.3
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.20
pypdf==5.4.0
python-docx==1.1.2
python-pptx==1.0.2
psutil==6.1.1
EOF

  # ---------------------------------------------------------------------------
  # Alembic migration support
  # ---------------------------------------------------------------------------
  mkdir -p "${APP_ROOT}/backend/alembic/versions"

  cat > "${APP_ROOT}/backend/alembic.ini" <<'EOF'
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = %(DATABASE_URL)s

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
EOF

  cat > "${APP_ROOT}/backend/alembic/env.py" <<'EOF'
import os
from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

database_url = os.getenv("DATABASE_URL", "")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

from app.models import Base  # noqa: E402
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
EOF

  cat > "${APP_ROOT}/backend/alembic/script.py.mako" <<'EOF'
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
EOF

  cat > "${APP_ROOT}/backend/alembic/versions/0001_initial_schema.py" <<'EOF'
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
EOF

  cat > "${APP_ROOT}/backend/Dockerfile" <<'EOF'
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

  cat > "${APP_ROOT}/backend/app/__init__.py" <<'EOF'
# Project DANILO backend package
EOF

  cat > "${APP_ROOT}/backend/app/database.py" <<'EOF'
import os
import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

logger = logging.getLogger("danilo.db")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be set by the installer-generated environment")

# PostgreSQL engine with connection pooling and health checks
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    connect_args={"connect_timeout": 15}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def wait_for_database(max_retries=None, delay=None):
    max_retries = int(os.getenv("DANILO_DB_MAX_RETRIES", str(max_retries or 120)))
    delay = float(os.getenv("DANILO_DB_RETRY_DELAY_SECONDS", str(delay or 3)))
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection established after %d attempts", attempt)
                return True
        except OperationalError as exc:
            if attempt >= max_retries:
                logger.error("Database connection failed after %d attempts", max_retries)
                raise
            wait_seconds = min(delay * attempt, 15)
            logger.warning(
                "Database not ready (attempt %d/%d): %s; retrying in %.1fs",
                attempt,
                max_retries,
                exc,
                wait_seconds,
            )
            time.sleep(wait_seconds)
    return False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

  cat > "${APP_ROOT}/backend/app/models.py" <<'EOF'
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'teacher', 'student')", name="ck_users_role"),
    )

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)
    username = Column(String(120), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=False)
    education_level = Column(String(40), nullable=True)
    grade_level = Column(String(50), nullable=True)
    strand = Column(String(80), nullable=True)
    section_name = Column(String(120), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    password_salt = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    force_password_change = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    taught_courses = relationship("Course", back_populates="teacher", foreign_keys="Course.teacher_id")
    enrollments = relationship("Enrollment", back_populates="student")
    department = relationship("Department", back_populates="members", foreign_keys=[department_id])
    chat_sessions = relationship("ChatSession", back_populates="user")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    head = relationship("User", foreign_keys=[head_id])
    members = relationship("User", back_populates="department", foreign_keys="User.department_id")
    courses = relationship("Course", back_populates="department")


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("quarter IN ('Q1', 'Q2', 'Q3', 'Q4')", name="ck_courses_quarter"),
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(120), nullable=False)
    education_level = Column(String(40), nullable=False, default="Junior High School")
    grade_level = Column(String(50), nullable=False)
    strand = Column(String(80), nullable=True)
    quarter = Column(String(2), nullable=False)
    school_year = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    teacher = relationship("User", back_populates="taught_courses")
    department = relationship("Department", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    modules = relationship("Module", back_populates="course")
    posts = relationship("StreamPost", back_populates="course")
    grades = relationship("GradeEntry", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("course_id", "student_id", name="uq_course_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(30), nullable=False, default="active")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")


class Module(Base):
    __tablename__ = "modules"
    __table_args__ = (
        CheckConstraint("quarter IN ('Q1', 'Q2', 'Q3', 'Q4')", name="ck_modules_quarter"),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    melc_code = Column(String(120), nullable=False)
    learning_competency = Column(Text, nullable=True)
    lesson_objectives = Column(Text, nullable=True)
    assessment_type = Column(String(120), nullable=True)
    grade_level = Column(String(50), nullable=False)
    subject = Column(String(120), nullable=False)
    quarter = Column(String(2), nullable=False)
    week = Column(Integer, nullable=False)
    sequence_order = Column(Integer, nullable=False, default=1)
    folder_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    essential_question = Column(Text, nullable=False)
    file_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="modules")
    conversations = relationship("AIConversation", back_populates="module")


class StreamPost(Base):
    __tablename__ = "stream_posts"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    post_type = Column(String(40), nullable=False, default="announcement")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="posts")
    author = relationship("User")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=True)
    points = Column(Float, nullable=False, default=100)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course")
    creator = relationship("User")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    response_text = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="submitted")
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    assignment = relationship("Assignment")
    student = relationship("User")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    is_published = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course")
    creator = relationship("User")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    choices_json = Column(Text, nullable=True)
    answer_key = Column(Text, nullable=True)
    points = Column(Float, nullable=False, default=1)

    quiz = relationship("Quiz")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers_json = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    quiz = relationship("Quiz")
    student = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(120), nullable=False)
    entity_type = Column(String(80), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor = relationship("User")


class GradeEntry(Base):
    __tablename__ = "grade_entries"
    __table_args__ = (
        CheckConstraint("quarter IN ('Q1', 'Q2', 'Q3', 'Q4')", name="ck_grade_entries_quarter"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    quarter = Column(String(2), nullable=False)
    component = Column(String(80), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="grades")
    student = relationship("User", foreign_keys=[student_id])
    recorder = relationship("User", foreign_keys=[recorded_by])


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("name", "grade_level", "school_year", name="uq_section_name_grade_year"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    grade_level = Column(String(50), nullable=False)
    education_level = Column(String(40), nullable=False, default="Junior High School")
    strand = Column(String(80), nullable=True)
    school_year = Column(String(20), nullable=False, default="2026-2027")
    adviser_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    adviser = relationship("User")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("User")
    course = relationship("Course")
    module = relationship("Module", back_populates="conversations")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="New Conversation")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True)
    response_mode = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("ChatSession", back_populates="messages")
    module = relationship("Module")
EOF

  cat > "${APP_ROOT}/backend/app/security.py" <<'EOF'
import os
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(str(password))


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        return password_context.verify(str(password), str(stored_hash))
    except Exception:
        return False


def create_access_token(payload: dict, secret: str, expires_minutes: int) -> str:
    claims = payload.copy()
    claims["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(claims, secret, algorithm="HS256")


def decode_access_token(token: str, secret: str) -> dict:
    return jwt.decode(token, secret, algorithms=["HS256"])
EOF

  cat > "${APP_ROOT}/backend/app/schemas.py" <<'EOF'
from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class TutorRequest(BaseModel):
    question: str = Field(min_length=4)
    module_id: int | None = None
    course_id: int | None = None
    session_id: int | None = None
    response_mode: str = "normal"

    @field_validator("response_mode")
    @classmethod
    def validate_response_mode(cls, value: str) -> str:
        mode = (value or "normal").strip().lower()
        if mode not in {"short", "normal", "detailed"}:
            return "normal"
        return mode
EOF

  cat > "${APP_ROOT}/backend/app/seed.py" <<'EOF'
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import User
from .security import hash_password, verify_password


def clean_seed_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = "".join(ch for ch in value.replace("\r", " ").replace("\n", " ") if ord(ch) < 128)
    cleaned = " ".join(cleaned.split())
    return cleaned or None


def get_or_create_user(
    session: Session,
    *,
    role: str,
    username: str,
    email: str,
    full_name: str,
    password: str,
    grade_level: str | None = None,
    education_level: str | None = None,
    section_name: str | None = None,
) -> User:
    user = session.scalar(select(User).where(func.lower(User.username) == username.lower()))
    if user:
        return user

    username = clean_seed_text(username) or ""
    email = clean_seed_text(email) or ""
    full_name = clean_seed_text(full_name) or ""
    password = clean_seed_text(password) or ""
    grade_level = clean_seed_text(grade_level)
    section_name = clean_seed_text(section_name)

    user = User(
        role=role,
        username=username,
        email=email,
        full_name=full_name,
        grade_level=grade_level,
        education_level=education_level,
        section_name=section_name,
        password_salt="",
        password_hash=hash_password(password),
        is_active=True,
    )
    session.add(user)
    session.flush()
    return user


def reset_password(user: User, password: str) -> None:
    user.password_salt = ""
    user.password_hash = hash_password(clean_seed_text(password) or "")


def seed_defaults(
    session: Session,
    *,
    admin_username: str,
    admin_password: str,
    portal_domain: str,
) -> None:
    clean_username = clean_seed_text(admin_username) or "admin"
    clean_password = clean_seed_text(admin_password)
    clean_portal_domain = clean_seed_text(portal_domain) or "local"
    if not clean_password:
        raise RuntimeError("ADMIN_PASSWORD must be set by the installer environment")

    admin = session.scalar(
        select(User).where(func.lower(User.username) == clean_username.lower())
    )
    if admin:
        admin.role = "admin"
        admin.username = clean_username
        admin.email = f"admin@{clean_portal_domain}"
        admin.full_name = "Danilo Network Administrator"
        admin.grade_level = None
        admin.section_name = None
        admin.is_active = True
        if not verify_password(clean_password, admin.password_hash):
            reset_password(admin, clean_password)
    else:
        get_or_create_user(
            session,
            role="admin",
            username=clean_username,
            email=f"admin@{clean_portal_domain}",
            full_name="Danilo Network Administrator",
            password=clean_password,
        )

    session.commit()
EOF

  cat > "${APP_ROOT}/backend/app/student_insights.py" <<'EOF'
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AIConversation, Assignment, Course, Enrollment, GradeEntry, Module, Quiz, QuizAttempt, QuizQuestion, Submission, User

LOW_SCORE_THRESHOLD = 75.0
ATTENTION_THRESHOLD = 80.0
RISK_THRESHOLD = 70.0


def percentage(score: float | None, max_score: float | None) -> float | None:
    if score is None or not max_score:
        return None
    return max(0.0, min(100.0, (float(score) / float(max_score)) * 100.0))


def average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def topic_label(value: str | None, fallback: str) -> str:
    text = " ".join(str(value or fallback).replace("\r", " ").replace("\n", " ").split())
    return text[:80] or fallback


def status_from_signals(avg_score: float | None, low_count: int, missing_count: int, repeated_incorrect: int) -> str:
    if avg_score is None and missing_count >= 2:
        return "At Risk"
    if (avg_score is not None and avg_score < RISK_THRESHOLD) or low_count >= 2 or missing_count >= 2 or repeated_incorrect >= 3:
        return "At Risk"
    if (avg_score is not None and avg_score < ATTENTION_THRESHOLD) or low_count >= 1 or missing_count >= 1 or repeated_incorrect >= 1:
        return "Needs Attention"
    return "Doing Well"


def action_for(status: str, weak_topic: str | None, missing_count: int) -> str:
    if status == "At Risk":
        if missing_count:
            return "Schedule a quick check-in and help the learner complete missing work."
        return f"Run a short remediation activity on {weak_topic or 'the weak topic'}."
    if status == "Needs Attention":
        return f"Give targeted practice on {weak_topic or 'recent lessons'} and monitor the next task."
    return "Keep the learner engaged with enrichment or peer support tasks."


def analyze_student_performance(db: Session, class_id: int) -> dict:
    course = db.get(Course, class_id)
    if not course:
        return {"course": None, "students": [], "classWeakTopics": [], "stats": {}}

    enrolled_students = (
        db.execute(
            select(User)
            .join(Enrollment, Enrollment.student_id == User.id)
            .where(Enrollment.course_id == class_id, Enrollment.status == "active", User.role == "student")
            .order_by(User.full_name.asc())
        )
        .scalars()
        .all()
    )
    assignments = db.scalars(select(Assignment).where(Assignment.course_id == class_id, Assignment.is_active == True)).all()
    submissions = db.scalars(select(Submission).join(Assignment, Submission.assignment_id == Assignment.id).where(Assignment.course_id == class_id)).all()
    submissions_by_student = {(item.student_id, item.assignment_id): item for item in submissions}
    grades = db.scalars(select(GradeEntry).where(GradeEntry.course_id == class_id).order_by(GradeEntry.created_at.asc())).all()
    grade_rows_by_student: dict[int, list[GradeEntry]] = {}
    for grade in grades:
        grade_rows_by_student.setdefault(grade.student_id, []).append(grade)

    quiz_rows = db.execute(select(QuizAttempt, Quiz).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(Quiz.course_id == class_id)).all()
    ai_rows = db.scalars(select(AIConversation).where(AIConversation.course_id == class_id)).all()
    ai_count_by_student: dict[int, int] = {}
    for conversation in ai_rows:
        ai_count_by_student[conversation.student_id] = ai_count_by_student.get(conversation.student_id, 0) + 1
    quiz_questions = db.scalars(select(QuizQuestion).join(Quiz, QuizQuestion.quiz_id == Quiz.id).where(Quiz.course_id == class_id)).all()
    questions_by_quiz: dict[int, list[QuizQuestion]] = {}
    for question in quiz_questions:
        questions_by_quiz.setdefault(question.quiz_id, []).append(question)
    quiz_max_by_id = {quiz_id: sum(question.points or 1 for question in questions) or None for quiz_id, questions in questions_by_quiz.items()}

    modules = db.scalars(select(Module).where(Module.course_id == class_id).order_by(Module.week.asc(), Module.sequence_order.asc())).all()
    module_topics = [topic_label(module.title or module.learning_competency, course.subject) for module in modules]

    topic_scores: dict[str, list[float]] = {}
    class_topic_risk: dict[str, float] = {}
    students = []
    now = datetime.now(timezone.utc)

    for student in enrolled_students:
        score_values: list[float] = []
        low_scores = 0
        student_topic_scores: dict[str, list[float]] = {}
        history_grades = []
        history_assignments = []
        missing_count = 0
        repeated_incorrect = 0

        for grade in grade_rows_by_student.get(student.id, []):
            pct = percentage(grade.score, grade.max_score)
            if pct is None:
                continue
            topic = topic_label(grade.component, course.subject)
            score_values.append(pct)
            student_topic_scores.setdefault(topic, []).append(pct)
            topic_scores.setdefault(topic, []).append(pct)
            if pct < LOW_SCORE_THRESHOLD:
                low_scores += 1
            history_grades.append({"id": grade.id, "topic": topic, "quarter": grade.quarter, "score": grade.score, "maxScore": grade.max_score, "percentage": round(pct, 1), "remarks": grade.remarks or ""})

        for assignment in assignments:
            submission = submissions_by_student.get((student.id, assignment.id))
            is_missing = submission is None or submission.status not in {"submitted", "completed"}
            if is_missing:
                missing_count += 1
                topic = topic_label(assignment.title, course.subject)
                class_topic_risk[topic] = class_topic_risk.get(topic, 0) + 1
            history_assignments.append({"id": assignment.id, "title": assignment.title, "points": assignment.points, "status": submission.status if submission else "missing", "submittedAt": submission.submitted_at.isoformat() if submission and submission.submitted_at else None})

        for attempt, quiz in quiz_rows:
            if attempt.student_id != student.id:
                continue
            quiz_pct = percentage(attempt.score, quiz_max_by_id.get(quiz.id) or 100)
            if quiz_pct is not None:
                topic = topic_label(quiz.title, course.subject)
                score_values.append(quiz_pct)
                student_topic_scores.setdefault(topic, []).append(quiz_pct)
                topic_scores.setdefault(topic, []).append(quiz_pct)
                if quiz_pct < LOW_SCORE_THRESHOLD:
                    low_scores += 1
            try:
                answers = json.loads(attempt.answers_json or "{}")
            except json.JSONDecodeError:
                answers = {}
            for question in questions_by_quiz.get(quiz.id, []):
                given = str(answers.get(str(question.id), answers.get(question.id, ""))).strip().lower() if isinstance(answers, dict) else ""
                expected = str(question.answer_key or "").strip().lower()
                if expected and given and given != expected:
                    repeated_incorrect += 1
                    q_topic = topic_label(question.question_text, quiz.title)
                    class_topic_risk[q_topic] = class_topic_risk.get(q_topic, 0) + 1

        avg_score = average(score_values)
        weak_topic = None
        weak_topic_score = None
        if student_topic_scores:
            topic_avgs = [(topic, average(values) or 0.0) for topic, values in student_topic_scores.items()]
            weak_topic, weak_topic_score = min(topic_avgs, key=lambda item: item[1])
        elif missing_count and assignments:
            weak_topic = topic_label(assignments[0].title, course.subject)
        elif module_topics:
            weak_topic = module_topics[0]

        status = status_from_signals(avg_score, low_scores, missing_count, repeated_incorrect)
        risk_reasons = []
        if avg_score is not None and avg_score < ATTENTION_THRESHOLD:
            risk_reasons.append(f"Average score is {avg_score:.1f}%.")
        if low_scores:
            risk_reasons.append(f"{low_scores} low score{'s' if low_scores != 1 else ''}.")
        if missing_count:
            risk_reasons.append(f"{missing_count} missing submission{'s' if missing_count != 1 else ''}.")
        if repeated_incorrect:
            risk_reasons.append(f"{repeated_incorrect} repeated incorrect quiz answer{'s' if repeated_incorrect != 1 else ''}.")
        if not risk_reasons:
            risk_reasons.append("No major risk signals detected.")

        students.append(
            {
                "studentId": student.id,
                "studentName": student.full_name,
                "username": student.username,
                "averageScore": round(avg_score, 1) if avg_score is not None else None,
                "status": status,
                "weakestTopic": weak_topic,
                "weakestTopicScore": round(weak_topic_score, 1) if weak_topic_score is not None else None,
                "lowScoreCount": low_scores,
                "missingSubmissionCount": missing_count,
                "repeatedIncorrectCount": repeated_incorrect,
                "aiInteractionCount": ai_count_by_student.get(student.id, 0),
                "lastAnalyzedAt": now.isoformat(),
                "explanation": " ".join(risk_reasons),
                "recommendedAction": action_for(status, weak_topic, missing_count),
                "history": {"grades": history_grades, "assignments": history_assignments},
            }
        )

    class_topic_rows = []
    for topic, values in topic_scores.items():
        avg_topic = average(values)
        if avg_topic is not None:
            class_topic_rows.append({"topic": topic, "averageScore": round(avg_topic, 1), "riskCount": 0})
    for topic, count in class_topic_risk.items():
        existing = next((item for item in class_topic_rows if item["topic"] == topic), None)
        if existing:
            existing["riskCount"] += int(count)
        else:
            class_topic_rows.append({"topic": topic, "averageScore": None, "riskCount": int(count)})
    class_topic_rows = sorted(class_topic_rows, key=lambda item: ((item["averageScore"] if item["averageScore"] is not None else 101), -item["riskCount"], item["topic"]))[:8]

    struggling = [item for item in students if item["status"] in {"At Risk", "Needs Attention"}]
    avg_values = [item["averageScore"] for item in students if item["averageScore"] is not None]
    return {
        "course": {"id": course.id, "code": course.code, "title": course.title, "subject": course.subject},
        "students": students,
        "strugglingStudents": struggling,
        "classWeakTopics": class_topic_rows,
        "stats": {
            "studentCount": len(students),
            "strugglingCount": len(struggling),
            "atRiskCount": len([item for item in students if item["status"] == "At Risk"]),
            "needsAttentionCount": len([item for item in students if item["status"] == "Needs Attention"]),
            "classAverage": round(average(avg_values), 1) if avg_values else None,
            "missingSubmissions": sum(item["missingSubmissionCount"] for item in students),
        },
    }
EOF

  cat > "${APP_ROOT}/backend/app/main.py" <<'EOF'
import csv
import io
import json
import os
import logging
import re
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
try:
    import psutil as _psutil
except ImportError:
    _psutil = None
from fastapi import APIRouter, Body, Depends, FastAPI, File, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, inspect, or_, select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db, wait_for_database
from .models import AIConversation, Assignment, AuditLog, ChatMessage, ChatSession, Course, Department, Enrollment, GradeEntry, Module, Quiz, QuizAttempt, QuizQuestion, Section, StreamPost, Submission, User
from .schemas import LoginRequest, TutorRequest
from .seed import seed_defaults
from .security import create_access_token, decode_access_token, hash_password, verify_password
from .student_insights import analyze_student_performance

import asyncio
import hashlib
from collections import OrderedDict
from logging.handlers import RotatingFileHandler

# ---------------------------------------------------------------------------
# Structured logging – write to rotating files in addition to stdout so that
# logs survive container restarts and can be read by the admin panel.
# ---------------------------------------------------------------------------
_LOG_DIR = os.getenv("DANILO_LOG_DIR", "/var/log/danilo")
os.makedirs(_LOG_DIR, exist_ok=True)

def _make_file_handler(name: str, max_bytes: int = 10 * 1024 * 1024, backups: int = 5) -> RotatingFileHandler:
    path = os.path.join(_LOG_DIR, name)
    handler = RotatingFileHandler(path, maxBytes=max_bytes, backupCount=backups)
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    return handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("danilo")
logger.addHandler(_make_file_handler("backend.log"))

# Separate AI logger for tutor interactions
ai_logger = logging.getLogger("danilo.ai")
ai_logger.addHandler(_make_file_handler("ai.log"))

JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))
OLLAMA_URL = os.getenv("OLLAMA_URL", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "45"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "2048"))
OLLAMA_CONTEXT_CHARS = int(os.getenv("OLLAMA_CONTEXT_CHARS", "1800"))
PORTAL_DOMAIN = os.getenv("PORTAL_DOMAIN", "")
SSID = os.getenv("SSID", "")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin").strip() or "admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://danilo.local,http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set by the installer environment")
if not OLLAMA_URL:
    raise RuntimeError("OLLAMA_URL must be set by the installer environment")
if not OLLAMA_MODEL:
    raise RuntimeError("OLLAMA_MODEL must be set by the installer environment")
if not PORTAL_DOMAIN:
    raise RuntimeError("PORTAL_DOMAIN must be set by the installer environment")
if not SSID:
    raise RuntimeError("SSID must be set by the installer environment")

# ---------------------------------------------------------------------------
# AI scalability protections
# Max 3 concurrent Ollama generations to protect 8 GB RAM environment.
# Per-user cooldown of 5 s between requests (prevents rapid-fire button spam).
# ---------------------------------------------------------------------------
_AI_MAX_CONCURRENT = int(os.getenv("DANILO_AI_MAX_CONCURRENT", "3"))
_AI_SEMAPHORE: asyncio.Semaphore | None = None  # created inside lifespan
_AI_USER_LAST_REQUEST: dict[int, float] = {}  # user_id -> timestamp
_AI_COOLDOWN_SECONDS = float(os.getenv("DANILO_AI_COOLDOWN_SECONDS", "5"))

# ---------------------------------------------------------------------------
# Lightweight LRU response cache: cache the last 256 distinct prompts so that
# students asking the same question get instant responses without loading the GPU.
# ---------------------------------------------------------------------------
_AI_CACHE_MAXSIZE = int(os.getenv("DANILO_AI_CACHE_SIZE", "256"))
_ai_response_cache: "OrderedDict[str, str]" = OrderedDict()

def _cache_key(prompt: str, mode: str) -> str:
    return hashlib.sha256(f"{mode}:{prompt}".encode()).hexdigest()

def _cache_get(prompt: str, mode: str) -> str | None:
    key = _cache_key(prompt, mode)
    if key in _ai_response_cache:
        _ai_response_cache.move_to_end(key)
        return _ai_response_cache[key]
    return None

def _cache_set(prompt: str, mode: str, response: str) -> None:
    key = _cache_key(prompt, mode)
    _ai_response_cache[key] = response
    _ai_response_cache.move_to_end(key)
    while len(_ai_response_cache) > _AI_CACHE_MAXSIZE:
        _ai_response_cache.popitem(last=False)

security = HTTPBearer()
router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api", tags=["admin"])
teacher_router = APIRouter(prefix="/api", tags=["teacher"])
student_router = APIRouter(prefix="/api", tags=["student"])
ai_router = APIRouter(prefix="/api", tags=["ai"])
classes_router = APIRouter(prefix="/api", tags=["classes"])


def migrate_users_table() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        Base.metadata.create_all(bind=engine)
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    with engine.begin() as connection:
        if "password_hash" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        if "password_salt" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_salt VARCHAR(255) DEFAULT ''"))
        if "role" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'student' NOT NULL"))
        if "email" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
        if "full_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) DEFAULT 'Project DANILO User' NOT NULL"))
        if "education_level" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN education_level VARCHAR(40)"))
        if "grade_level" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN grade_level VARCHAR(50)"))
        if "strand" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN strand VARCHAR(80)"))
        if "section_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN section_name VARCHAR(120)"))
        if "is_active" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL"))
        if "created_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL"))

    inspector = inspect(engine)
    course_columns = {column["name"] for column in inspector.get_columns("courses")} if "courses" in inspector.get_table_names() else set()
    module_columns = {column["name"] for column in inspector.get_columns("modules")} if "modules" in inspector.get_table_names() else set()
    user_columns = {column["name"] for column in inspector.get_columns("users")} if "users" in inspector.get_table_names() else set()
    with engine.begin() as connection:
        if "courses" in inspector.get_table_names() and "teacher_id" in course_columns:
            connection.execute(text("ALTER TABLE courses ALTER COLUMN teacher_id DROP NOT NULL"))
        if "courses" in inspector.get_table_names() and "is_active" not in course_columns:
            connection.execute(text("ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL"))
        if "courses" in inspector.get_table_names() and "education_level" not in course_columns:
            connection.execute(text("ALTER TABLE courses ADD COLUMN education_level VARCHAR(40) DEFAULT 'Junior High School' NOT NULL"))
        if "courses" in inspector.get_table_names() and "strand" not in course_columns:
            connection.execute(text("ALTER TABLE courses ADD COLUMN strand VARCHAR(80)"))
        if "courses" in inspector.get_table_names() and "department_id" not in course_columns:
            connection.execute(text("ALTER TABLE courses ADD COLUMN department_id INTEGER REFERENCES departments(id)"))
        if "modules" in inspector.get_table_names() and "file_url" not in module_columns:
            connection.execute(text("ALTER TABLE modules ADD COLUMN file_url VARCHAR(500)"))
        if "modules" in inspector.get_table_names() and "content" not in module_columns:
            connection.execute(text("ALTER TABLE modules ADD COLUMN content TEXT"))
        if "modules" in inspector.get_table_names() and "learning_competency" not in module_columns:
            connection.execute(text("ALTER TABLE modules ADD COLUMN learning_competency TEXT"))
        if "modules" in inspector.get_table_names() and "lesson_objectives" not in module_columns:
            connection.execute(text("ALTER TABLE modules ADD COLUMN lesson_objectives TEXT"))
        if "modules" in inspector.get_table_names() and "assessment_type" not in module_columns:
            connection.execute(text("ALTER TABLE modules ADD COLUMN assessment_type VARCHAR(120)"))
        if "users" in inspector.get_table_names() and "department_id" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)"))
        if "users" in inspector.get_table_names() and "force_password_change" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT false NOT NULL"))

    inspector = inspect(engine)
    submission_columns = {column["name"] for column in inspector.get_columns("submissions")} if "submissions" in inspector.get_table_names() else set()
    with engine.begin() as connection:
        if "submissions" in inspector.get_table_names() and "score" not in submission_columns:
            connection.execute(text("ALTER TABLE submissions ADD COLUMN score FLOAT"))
        if "submissions" in inspector.get_table_names() and "feedback" not in submission_columns:
            connection.execute(text("ALTER TABLE submissions ADD COLUMN feedback TEXT"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _AI_SEMAPHORE
    _AI_SEMAPHORE = asyncio.Semaphore(_AI_MAX_CONCURRENT)
    wait_for_database()
    migrate_users_table()
    db = SessionLocal()
    try:
        seed_defaults(
            db,
            admin_username=ADMIN_USERNAME,
            admin_password=ADMIN_PASSWORD,
            portal_domain=PORTAL_DOMAIN,
        )
    finally:
        db.close()
    yield


app = FastAPI(
    title="Project DANILO API",
    version="1.0.0",
    description="Offline-first DepEd school portal API — authentication, LMS, AI tutor, and system health.",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "health", "description": "Service and AI health checks"},
        {"name": "auth", "description": "Authentication and password management"},
        {"name": "dashboard", "description": "Role-aware dashboard data"},
        {"name": "content", "description": "Lesson modules and content tree"},
        {"name": "grades", "description": "Student grade records"},
        {"name": "ai", "description": "AI tutor (DANILO) — chat, sessions, streaming"},
        {"name": "admin", "description": "School admin — users, courses, sections, system"},
        {"name": "teacher", "description": "Faculty — courses, gradebook, insights, quizzes"},
        {"name": "student", "description": "Learner — courses, assignments, quiz attempts"},
        {"name": "classes", "description": "Shared classroom endpoints (teacher + student)"},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    logger.warning("HTTP %s on %s: %s", exc.status_code, request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "status": exc.status_code})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    logger.exception("Unhandled error on %s: %s", request.url.path, str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "status": 500})


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials, JWT_SECRET)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")
    return user


ROLE_DISPLAY = {"student": "Learner", "teacher": "Faculty", "admin": "Admin"}


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "role": user.role,
        "displayRole": ROLE_DISPLAY.get(user.role, user.role.capitalize()),
        "username": user.username,
        "email": user.email,
        "fullName": user.full_name,
        "educationLevel": user.education_level,
        "gradeLevel": user.grade_level,
        "strand": user.strand,
        "sectionName": user.section_name,
        "departmentId": user.department_id,
        "isActive": user.is_active,
        "forcePasswordChange": bool(getattr(user, "force_password_change", False)),
    }


def require_role(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action")


def clean_text(value, *, required: bool = True, max_length: int = 255) -> str | None:
    if value is None:
        if required:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing required field")
        return None
    text_value = " ".join(str(value).replace("\r", " ").replace("\n", " ").split())
    if required and not text_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Required field cannot be blank")
    if len(text_value) > max_length:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Field is too long; max {max_length} characters")
    return text_value or None


def parse_int(value, field: str, *, required: bool = True, minimum: int | None = None) -> int | None:
    if value in (None, ""):
        if required:
            raise HTTPException(status_code=400, detail=f"{field} is required")
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a whole number") from exc
    if minimum is not None and parsed < minimum:
        raise HTTPException(status_code=400, detail=f"{field} must be at least {minimum}")
    return parsed


def parse_float(value, field: str, *, required: bool = True, minimum: float | None = None, maximum: float | None = None) -> float | None:
    if value in (None, ""):
        if required:
            raise HTTPException(status_code=400, detail=f"{field} is required")
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a number") from exc
    if minimum is not None and parsed < minimum:
        raise HTTPException(status_code=400, detail=f"{field} must be at least {minimum}")
    if maximum is not None and parsed > maximum:
        raise HTTPException(status_code=400, detail=f"{field} must be at most {maximum}")
    return parsed


def parse_bool(value, field: str, *, default: bool | None = None) -> bool:
    if value in (None, ""):
        if default is not None:
            return default
        raise HTTPException(status_code=400, detail=f"{field} is required")
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes", "y"}:
            return True
        if lowered in {"false", "0", "no", "n"}:
            return False
    raise HTTPException(status_code=400, detail=f"{field} must be true or false")


EDUCATION_LEVELS = {
    "Kinder": ["Kinder"],
    "Elementary": [f"Grade {grade}" for grade in range(1, 7)],
    "Junior High School": [f"Grade {grade}" for grade in range(7, 11)],
    "Senior High School": [f"Grade {grade}" for grade in range(11, 13)],
}
SHS_STRANDS = {"STEM", "ABM", "HUMSS", "GAS", "TVL", "Arts and Design", "Sports"}
DEPED_SUBJECTS = {
    "Filipino", "English", "Mathematics", "Science", "Araling Panlipunan", "MAPEH", "TLE", "ESP",
    "Mother Tongue", "Oral Communication", "Reading and Writing", "General Mathematics",
    "Statistics and Probability", "Earth and Life Science", "Physical Science", "Biology",
    "Chemistry", "Physics", "Practical Research", "Media and Information Literacy",
    "Empowerment Technologies", "Personal Development", "Contemporary Arts",
    "Understanding Culture, Society, and Politics", "Philosophy",
}
ASSESSMENT_TYPES = {"Written Work", "Performance Task", "Quarterly Assessment", "Quiz", "Assignment", "Project", "Recitation", "Portfolio"}
MATERIAL_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".docx", ".txt"}
MAX_MATERIAL_BYTES = int(os.getenv("DANILO_MAX_UPLOAD_BYTES", str(12 * 1024 * 1024)))


def normalize_local_account(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def generated_username_from_name(full_name: str, role: str = "student", section_name: str | None = None) -> str:
    parts = full_name.replace(".", " ").split()
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Full name must include at least first and last name")
    initials = "".join(p[0].upper() for p in parts if p)
    if role == "teacher":
        prefix = "FAC"
        return f"{prefix}-{initials}"
    elif role == "admin":
        prefix = "ADM"
        return f"{prefix}-{initials}"
    section_prefix = normalize_local_account(section_name or "").upper() if section_name else "LRN"
    return f"{section_prefix}-{initials}"


def unique_local_username(db: Session, base_username: str, user_id: int | None = None) -> str:
    import string
    candidate = base_username
    for suffix in [""] + list(string.ascii_lowercase):
        attempt = f"{candidate}{suffix}" if suffix else candidate
        stmt = select(User).where(func.lower(User.username) == attempt.lower())
        if user_id:
            stmt = stmt.where(User.id != user_id)
        if not db.scalar(stmt):
            return attempt
    raise HTTPException(status_code=409, detail="Could not generate a unique username — please specify one manually")


def validate_grade_path(education_level: str | None, grade_level: str | None, strand: str | None) -> tuple[str | None, str | None, str | None]:
    if not education_level and not grade_level and not strand:
        return None, None, None
    if education_level not in EDUCATION_LEVELS:
        raise HTTPException(status_code=400, detail="Education level must be Kinder, Elementary, Junior High School, or Senior High School")
    if grade_level not in EDUCATION_LEVELS[education_level]:
        raise HTTPException(status_code=400, detail="Grade level does not match education level")
    if education_level == "Senior High School":
        if strand not in SHS_STRANDS:
            raise HTTPException(status_code=400, detail="Senior High School requires a valid strand")
    elif strand:
        raise HTTPException(status_code=400, detail="Strand is only allowed for Senior High School")
    return education_level, grade_level, strand


def validate_deped_subject(subject: str | None) -> str:
    cleaned = clean_text(subject, max_length=120)
    if cleaned not in DEPED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Subject must be a supported DepEd learning area")
    return cleaned


def validate_quarter(value: str | None) -> str:
    quarter = clean_text(value or "Q1", max_length=2)
    if quarter not in {"Q1", "Q2", "Q3", "Q4"}:
        raise HTTPException(status_code=400, detail="Quarter must be Q1, Q2, Q3, or Q4")
    return quarter


def validate_assessment_type(value: str | None) -> str | None:
    assessment_type = clean_text(value, required=False, max_length=120)
    if assessment_type and assessment_type not in ASSESSMENT_TYPES:
        raise HTTPException(status_code=400, detail="Assessment type must be a supported classroom assessment")
    return assessment_type


def get_user_class(db: Session, user: User, course_id: int) -> Course:
    """Return a course if the user is its assigned teacher or an enrolled student.
    Admin accounts use dedicated /admin/courses/* endpoints and are intentionally
    excluded here to enforce strict role separation."""
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if user.role == "teacher" and course.teacher_id == user.id:
        return course
    if user.role == "student" and db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == user.id, Enrollment.status == "active")):
        return course
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this class")


def serialize_course(course: Course) -> dict:
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "subject": course.subject,
        "educationLevel": course.education_level,
        "gradeLevel": course.grade_level,
        "strand": course.strand,
        "quarter": course.quarter,
        "schoolYear": course.school_year,
        "description": course.description,
        "teacherId": course.teacher_id,
        "teacherName": course.teacher.full_name if course.teacher else "Unassigned",
        "departmentId": course.department_id,
        "departmentName": course.department.name if course.department else "",
        "isActive": course.is_active,
    }


def summarize_grade_entries(course: Course, rows: list[GradeEntry], student_name: str | None = None) -> list[dict]:
    buckets: dict[str, dict] = {}
    for grade in rows:
        bucket = buckets.setdefault(
            grade.quarter,
            {
                "courseId": course.id,
                "courseCode": course.code,
                "courseTitle": course.title,
                "subject": course.subject,
                "quarter": grade.quarter,
                "teacher": course.teacher.full_name if course.teacher else "",
                "studentName": student_name,
                "components": [],
                "weightedScore": 0.0,
                "weightTotal": 0.0,
            },
        )
        normalized = (grade.score / grade.max_score) * 100.0 if grade.max_score else 0.0
        bucket["components"].append(
            {
                "id": grade.id,
                "component": grade.component,
                "score": grade.score,
                "maxScore": grade.max_score,
                "weight": grade.weight,
                "remarks": grade.remarks or "",
                "percentage": round(normalized, 2),
            }
        )
        bucket["weightedScore"] += normalized * grade.weight
        bucket["weightTotal"] += grade.weight
    summary = []
    for bucket in buckets.values():
        total = bucket["weightedScore"] / bucket["weightTotal"] if bucket["weightTotal"] else 0.0
        bucket["finalGrade"] = round(total, 2)
        bucket.pop("weightedScore")
        bucket.pop("weightTotal")
        summary.append(bucket)
    return sorted(summary, key=lambda item: item["quarter"])


def log_action(db: Session, actor: User | None, action: str, entity_type: str, entity_id: int | None = None, details: str | None = None) -> None:
    db.add(AuditLog(actor_id=actor.id if actor else None, action=action, entity_type=entity_type, entity_id=entity_id, details=details))


def ensure_teacher_course(db: Session, teacher: User, course_id: int) -> Course:
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if teacher.role != "teacher" or course.teacher_id != teacher.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage assigned classes")
    return course


def ensure_student_enrolled(db: Session, student: User, course_id: int) -> Course:
    course = db.get(Course, course_id)
    enrolled = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student.id, Enrollment.status == "active"))
    if not course or not course.is_active or not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your enrolled classes")
    return course


def build_content_workflow_status() -> dict:
    return {
        "pdfUploadReady": True,
        "aiLessonGenerationReady": True,
        "status": "ready",
        "title": "Teacher Material Upload",
        "message": "Teachers can upload PDF, PPT, PPTX, DOCX, or TXT files and generate editable lesson modules.",
        "nextStep": "Open an assigned class, upload a source file, review the generated lesson, and save or regenerate it.",
    }


def cleaned_material_text(value: str | None, limit: int = 12000) -> str:
    text_value = str(value or "")
    text_value = text_value.replace("\x00", " ")
    text_value = re.sub(r"[ \t\r\f\v]+", " ", text_value)
    text_value = re.sub(r"\n{3,}", "\n\n", text_value)
    text_value = "\n".join(line.strip() for line in text_value.splitlines())
    text_value = text_value.strip()
    if len(text_value) > limit:
        text_value = text_value[:limit].rsplit(" ", 1)[0]
    return text_value


def plain_text_from_bytes(data: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore")


def extract_material_text(filename: str, data: bytes) -> str:
    suffix = os.path.splitext(filename.lower())[1]
    if suffix not in MATERIAL_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported material type. Upload PDF, PPT, PPTX, DOCX, or TXT.")
    if len(data) > MAX_MATERIAL_BYTES:
        raise HTTPException(status_code=400, detail="Uploaded material is too large for this offline device.")

    try:
        if suffix == ".txt":
            return cleaned_material_text(plain_text_from_bytes(data))
        if suffix == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(data))
            return cleaned_material_text("\n".join(page.extract_text() or "" for page in reader.pages))
        if suffix == ".docx":
            from docx import Document

            document = Document(io.BytesIO(data))
            return cleaned_material_text("\n".join(paragraph.text for paragraph in document.paragraphs))
        if suffix == ".pptx":
            from pptx import Presentation

            deck = Presentation(io.BytesIO(data))
            lines = []
            for slide in deck.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        lines.append(shape.text)
            return cleaned_material_text("\n".join(lines))
        if suffix == ".ppt":
            # Binary PPT parsing is intentionally conservative; this keeps old
            # files usable when they contain extractable text streams.
            return cleaned_material_text(plain_text_from_bytes(data))
    except Exception as exc:
        logger.exception("Material extraction failed for %s", filename)
        raise HTTPException(status_code=400, detail=f"Could not extract readable text from {suffix.upper()} material") from exc

    raise HTTPException(status_code=400, detail="Unsupported material type")


def generated_lesson_from_text(course: Course, filename: str, text: str) -> dict:
    if len(text.split()) < 20:
        raise HTTPException(status_code=400, detail="Uploaded material does not contain enough readable lesson text")
    title_seed = os.path.splitext(os.path.basename(filename))[0].replace("_", " ").replace("-", " ")
    title = clean_text(title_seed.title() or f"{course.subject} Lesson", max_length=255)
    summary = trim_text(text, 700)
    essential_question = f"How can learners apply the main ideas from {title} in real-life situations?"
    objectives = [
        f"Identify key ideas from the uploaded {course.subject} material.",
        "Explain the main concept in their own words.",
        "Answer a short practice task using the lesson context.",
    ]
    return {
        "melcCode": "AI-GENERATED",
        "learningCompetency": f"DepEd-aligned competency for {course.subject}; teacher should review before class use.",
        "lessonObjectives": " ".join(objectives),
        "assessmentType": "Written Work",
        "quarter": course.quarter,
        "week": 1,
        "sequenceOrder": 1,
        "folderName": f"{course.code}/AI Generated",
        "title": title,
        "summary": summary,
        "essentialQuestion": essential_question,
        "content": f"AI-generated draft from {filename}.\n\n{text}",
        "fileUrl": None,
        "aiGenerated": True,
        "sourceFilename": filename,
    }


def build_grade_summary(db: Session, student_id: int) -> list[dict]:
    rows = (
        db.execute(
            select(GradeEntry, Course)
            .join(Course, GradeEntry.course_id == Course.id)
            .where(GradeEntry.student_id == student_id)
            .order_by(Course.subject.asc(), GradeEntry.quarter.asc(), GradeEntry.created_at.asc())
        )
        .all()
    )

    buckets: dict[tuple[int, str], dict] = {}
    for grade, course in rows:
        key = (course.id, grade.quarter)
        bucket = buckets.setdefault(
            key,
            {
                "courseId": course.id,
                "courseCode": course.code,
                "courseTitle": course.title,
                "subject": course.subject,
                "quarter": grade.quarter,
                "teacher": course.teacher.full_name if course.teacher else "",
                "components": [],
                "weightedScore": 0.0,
                "weightTotal": 0.0,
            },
        )
        normalized = (grade.score / grade.max_score) * 100.0 if grade.max_score else 0.0
        bucket["components"].append(
            {
                "component": grade.component,
                "score": grade.score,
                "maxScore": grade.max_score,
                "weight": grade.weight,
                "remarks": grade.remarks or "",
                "percentage": round(normalized, 2),
            }
        )
        bucket["weightedScore"] += normalized * grade.weight
        bucket["weightTotal"] += grade.weight

    summary = []
    for bucket in buckets.values():
        total = bucket["weightedScore"] / bucket["weightTotal"] if bucket["weightTotal"] else 0.0
        bucket["finalGrade"] = round(total, 2)
        bucket.pop("weightedScore")
        bucket.pop("weightTotal")
        summary.append(bucket)
    return sorted(summary, key=lambda item: (item["subject"], item["quarter"]))


def build_content_tree(db: Session, *, user: User | None = None, query: str | None = None, quarter: str | None = None, subject: str | None = None) -> list[dict]:
    stmt = (
        select(Module, Course)
        .join(Course, Module.course_id == Course.id)
        .order_by(Module.grade_level.asc(), Module.subject.asc(), Module.quarter.asc(), Module.week.asc(), Module.sequence_order.asc())
    )
    if query:
        like_query = f"%{query.strip()}%"
        stmt = stmt.where(or_(Module.title.ilike(like_query), Module.summary.ilike(like_query), Module.folder_name.ilike(like_query)))
    if quarter:
        stmt = stmt.where(Module.quarter == quarter)
    if subject:
        stmt = stmt.where(Module.subject == subject)
    # Admin sees no classroom content here; admin uses /admin/courses/* for oversight
    if user and user.role == "admin":
        return []
    if user and user.role == "teacher":
        stmt = stmt.where(Course.teacher_id == user.id)
    if user and user.role == "student":
        stmt = stmt.join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == user.id, Enrollment.status == "active")

    rows = db.execute(stmt).all()
    items = []
    for module, course in rows:
        items.append(
            {
                "id": module.id,
                "courseId": course.id,
                "courseCode": course.code,
                "courseTitle": course.title,
                "subject": module.subject,
                "gradeLevel": module.grade_level,
                "quarter": module.quarter,
                "week": module.week,
                "folderName": module.folder_name,
                "melcCode": module.melc_code,
                "learningCompetency": module.learning_competency or "",
                "lessonObjectives": module.lesson_objectives or "",
                "assessmentType": module.assessment_type or "",
                "title": module.title,
                "summary": module.summary,
                "essentialQuestion": module.essential_question,
                "pdfUrl": f"/api/content/{module.id}/pdf",
                "content": module.content or "",
            }
        )
    return items


def build_stream(db: Session, user: User | None = None) -> list[dict]:
    stmt = (
        select(StreamPost, Course, User)
        .join(Course, StreamPost.course_id == Course.id)
        .join(User, StreamPost.author_id == User.id)
        .order_by(StreamPost.created_at.desc())
        .limit(24)
    )
    if user and user.role == "teacher":
        stmt = stmt.where(Course.teacher_id == user.id)
    if user and user.role == "student":
        stmt = stmt.join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == user.id, Enrollment.status == "active")
    rows = db.execute(stmt).all()
    return [
        {
            "id": post.id,
            "courseId": course.id,
            "title": post.title,
            "body": post.body,
            "postType": post.post_type,
            "createdAt": post.created_at.isoformat() if post.created_at else "",
            "courseCode": course.code,
            "courseTitle": course.title,
            "authorName": author.full_name,
        }
        for post, course, author in rows
    ]


def build_teacher_course_cards(db: Session, teacher_id: int) -> list[dict]:
    courses = db.scalars(select(Course).where(Course.teacher_id == teacher_id, Course.is_active == True).order_by(Course.subject.asc())).all()
    cards = []
    for course in courses:
        student_total = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        module_total = db.query(Module).filter(Module.course_id == course.id).count()
        cards.append(
            {
                "id": course.id,
                "code": course.code,
                "title": course.title,
                "subject": course.subject,
                "educationLevel": course.education_level,
                "quarter": course.quarter,
                "gradeLevel": course.grade_level,
                "strand": course.strand,
                "studentTotal": student_total,
                "moduleTotal": module_total,
                "description": course.description,
            }
        )
    return cards


def build_admin_course_cards(db: Session) -> list[dict]:
    courses = db.scalars(select(Course).where(Course.is_active == True).order_by(Course.subject.asc(), Course.quarter.asc())).all()
    cards = []
    for course in courses:
        student_total = db.query(Enrollment).filter(Enrollment.course_id == course.id).count()
        module_total = db.query(Module).filter(Module.course_id == course.id).count()
        cards.append(
            {
                "id": course.id,
                "code": course.code,
                "title": course.title,
                "subject": course.subject,
                "educationLevel": course.education_level,
                "gradeLevel": course.grade_level,
                "strand": course.strand,
                "quarter": course.quarter,
                "studentTotal": student_total,
                "moduleTotal": module_total,
                "teacherName": course.teacher.full_name if course.teacher else "Unassigned",
                "description": course.description,
            }
        )
    return cards


def build_student_course_cards(db: Session, student_id: int) -> list[dict]:
    rows = (
        db.execute(
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(Enrollment.student_id == student_id, Enrollment.status == "active", Course.is_active == True)
            .order_by(Course.subject.asc())
        )
        .scalars()
        .all()
    )
    return [
        {
            "id": course.id,
            "code": course.code,
            "title": course.title,
            "subject": course.subject,
            "educationLevel": course.education_level,
            "gradeLevel": course.grade_level,
            "strand": course.strand,
            "quarter": course.quarter,
            "description": course.description,
        }
        for course in rows
    ]


def escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf_document(title: str, lines: list[str]) -> bytes:
    content = ["BT", "/F1 24 Tf", "72 740 Td", f"({escape_pdf_text(title)}) Tj", "/F1 13 Tf"]
    for line in lines:
        content.append("0 -26 Td")
        content.append(f"({escape_pdf_text(line)}) Tj")
    content.append("ET")
    stream = "\n".join(content).encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream",
    ]

    pdf = b"%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{index} 0 obj\n".encode("latin-1") + obj + b"\nendobj\n"

    xref_offset = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n".encode("latin-1")
    pdf += b"0000000000 65535 f \n"
    for offset in offsets[1:]:
        pdf += f"{offset:010d} 00000 n \n".encode("latin-1")
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1")
    return pdf


SYSTEM_PROMPT = (
    "You are DANILO (Digital Assistant Network for Interactive Learning Offline), an offline "
    "DepEd-aligned AI tutor for Filipino students in Grades 1-12. "
    "Project DANILO exists to help schools address the 91% learning poverty rate by making "
    "safe lessons, remediation, and teacher support available without internet. "
    "Explain clearly, simply, and accurately. Use lesson context when available. Do not hallucinate.\n\n"
    "SAFETY RULES (STRICTLY ENFORCED — users are under 18):\n"
    "- Never produce violent, sexual, explicit, or age-inappropriate content.\n"
    "- Never provide instructions for weapons, drugs, self-harm, or illegal activities.\n"
    "- If a question is harmful, off-topic, or inappropriate, respond with a polite educational redirect.\n"
    "- Keep all responses respectful, age-appropriate, and focused on learning.\n"
    "- When unsure, guide the learner back to their lesson or subject.\n\n"
    "TONE: Encouraging, clear, patient, and age-appropriate at all times."
)
SAFETY_KEYWORDS = {
    "kill", "suicide", "bomb", "weapon", "drug", "sex", "porn", "nude", "hack",
    "exploit", "violence", "murder", "abuse", "self-harm", "cutting", "anorexia",
    "bulimia", "alcohol", "cigarette", "vape", "gambling", "bet", "nsfw",
}
SAFETY_REDIRECT = (
    "I'm DANILO, your learning assistant. I can only help with school-related topics. "
    "Let's focus on your lessons — what subject would you like help with?"
)
ROLLING_MEMORY_LIMIT = int(os.getenv("DANILO_ROLLING_MEMORY", "5"))
RESPONSE_MODE_OPTIONS = {
    "short": {"num_predict": 120, "instruction": "Answer briefly in 1 to 2 short paragraphs."},
    "normal": {"num_predict": 280, "instruction": "Answer in 2 to 4 clear paragraphs with a learner-friendly tone."},
    "detailed": {"num_predict": 600, "instruction": "Give a fuller ChatGPT-like explanation with steps and examples when helpful."},
}


def check_safety(question: str) -> bool:
    words = set(question.lower().split())
    return bool(words & SAFETY_KEYWORDS)


def build_rolling_memory(db: Session, user_id: int, course_id: int | None, limit: int) -> list[dict]:
    # Fetch recent history (limit * 2 gives us request/response pairs)
    stmt = (
        select(ChatMessage)
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(ChatSession.user_id == user_id, ChatSession.is_active == True)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit * 2)
    )
    rows = db.scalars(stmt).all()
    memory = []
    
    # Calculate rolling token budget. 
    # Max ctx=2048. System prompt/context takes ~1000 tokens.
    # Leave 500 for the response. We have ~548 tokens (approx 2000 chars) for memory.
    char_budget = 2000 
    current_chars = 0

    for row in rows: # We iterate from newest to oldest
        content = trim_text(row.content, 400)
        chars = len(content)
        
        # If adding this message exceeds the context safety budget, we stop loading history.
        if current_chars + chars > char_budget:
            break
            
        current_chars += chars
        memory.append({"role": row.role if row.role in ("user", "assistant") else "user", "content": content})
        
    return list(reversed(memory)) # Return chronological order


def tutor_mode(value: str | None) -> str:
    mode = (value or "normal").strip().lower()
    return mode if mode in RESPONSE_MODE_OPTIONS else "normal"


def trim_text(value: str | None, limit: int) -> str:
    text_value = " ".join(str(value or "").replace("\r", " ").replace("\n", " ").split())
    if len(text_value) <= limit:
        return text_value
    return text_value[:limit].rsplit(" ", 1)[0] + " ..."


def estimate_prompt_tokens(prompt: str) -> int:
    return max(1, len(prompt) // 4)


def ollama_chat_payload(prompt: str, mode: str, *, stream: bool, memory: list[dict] | None = None) -> dict:
    mode = tutor_mode(mode)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if memory:
        messages.extend(memory)
    messages.append({"role": "user", "content": prompt})
    return {
        "model": OLLAMA_MODEL,
        "stream": stream,
        "keep_alive": os.getenv("OLLAMA_KEEP_ALIVE", "10m"),
        "messages": messages,
        "options": {
            "temperature": 0.3,
            "top_p": 0.9,
            "top_k": 40,
            "repeat_penalty": 1.1,
            "num_ctx": OLLAMA_NUM_CTX,
            "num_predict": RESPONSE_MODE_OPTIONS[mode]["num_predict"],
            "num_thread": 4,
        },
    }


def build_tutor_prompt(
    db: Session,
    current_user: User,
    payload: TutorRequest,
) -> tuple[str, Module | None, Course | None, list[str], str]:
    module = db.get(Module, payload.module_id) if payload.module_id else None
    course = db.get(Course, payload.course_id) if payload.course_id else (module.course if module else None)
    mode = tutor_mode(payload.response_mode)
    if course:
        course = get_user_class(db, current_user, course.id)
    if module and course and module.course_id != course.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lesson context is not part of this class")

    student_grades = build_grade_summary(db, current_user.id)[:3] if current_user.role == "student" else []
    grade_lines = [
        f"{item['courseCode']} {item['quarter']}: final grade {item['finalGrade']}"
        for item in student_grades
    ] or ["No recorded grades yet."]

    quiz_lines: list[str] = []
    if current_user.role == "student":
        quiz_query = select(QuizAttempt, Quiz).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(QuizAttempt.student_id == current_user.id)
        if course:
            quiz_query = quiz_query.where(Quiz.course_id == course.id)
        recent_attempts = db.execute(quiz_query.order_by(QuizAttempt.submitted_at.desc()).limit(5)).all()
        for attempt, quiz in recent_attempts:
            questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.id.asc())).all()
            incorrect_qs = []
            try:
                answers = json.loads(attempt.answers_json or "{}")
            except json.JSONDecodeError:
                answers = {}
            for q in questions:
                given = str(answers.get(str(q.id), "")).strip().lower()
                expected = str(q.answer_key or "").strip().lower()
                if expected and given != expected:
                    incorrect_qs.append(q.question_text[:80])
            quiz_lines.append(
                f"Quiz \"{quiz.title}\": scored {attempt.score}%"
                + (f" — missed: {'; '.join(incorrect_qs[:3])}" if incorrect_qs else " — all correct")
            )
        if not quiz_lines:
            quiz_lines.append("No quiz attempts recorded yet.")

    context_budget = max(600, OLLAMA_CONTEXT_CHARS)
    lesson_lines = []
    if course:
        lesson_lines.append(f"Subject: {trim_text(course.title, 120)}")
    if module:
        content_parts = [
            f"Module: {module.title}",
            f"MELC: {module.melc_code}",
            f"Learning Competency: {module.learning_competency or 'Not specified'}",
            f"Lesson Objectives: {module.lesson_objectives or 'Not specified'}",
            f"Summary: {module.summary}",
            f"Essential Question: {module.essential_question}",
            f"Content: {module.content or ''}",
        ]
        lesson_lines.append(trim_text(" | ".join(content_parts), context_budget))

    prompt = "\n".join(
        [
            RESPONSE_MODE_OPTIONS[mode]["instruction"],
            "Use Filipino when the learner asks in Filipino; otherwise use English.",
            "Use only the lesson context when the question depends on lesson facts. If context is missing, say more information is needed.",
            "Include one short example or practice task when useful. Never break character — always respond as a school tutor.",
            f"Learner Grade Level: {current_user.grade_level or 'Not specified'}",
            "Recorded Grades:",
            *[f"- {line}" for line in grade_lines],
            "Quiz Performance:",
            *[f"- {line}" for line in quiz_lines],
            "Lesson Context:",
            *[f"- {line}" for line in (lesson_lines or ["No selected lesson."])],
            f"Learner Question: {payload.question.strip()}",
        ]
    )
    return prompt, module, course, grade_lines, mode


def save_ai_conversation(
    db: Session,
    *,
    user_id: int,
    course_id: int | None,
    module_id: int | None,
    question: str,
    answer: str,
) -> None:
    db.add(
        AIConversation(
            student_id=user_id,
            course_id=course_id,
            module_id=module_id,
            prompt=question.strip(),
            response=answer.strip(),
        )
    )
    db.commit()


async def ask_ollama(prompt: str, mode: str, memory: list[dict] | None = None) -> tuple[str, dict]:
    # Check response cache first (no semaphore needed for cache hits)
    cached = _cache_get(prompt, mode)
    if cached:
        ai_logger.info("AI cache hit mode=%s prompt_len=%s", mode, len(prompt))
        return cached, {"model": OLLAMA_MODEL, "mode": mode, "duration_ms": 0, "cache": True}

    sem = _AI_SEMAPHORE or asyncio.Semaphore(_AI_MAX_CONCURRENT)
    payload = ollama_chat_payload(prompt, mode, stream=False, memory=memory)
    started = time.perf_counter()
    prompt_tokens = estimate_prompt_tokens(prompt)
    timeout = httpx.Timeout(OLLAMA_TIMEOUT_SECONDS, connect=5.0)
    async with sem:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            response.raise_for_status()
            body = response.json()
    duration_ms = int((time.perf_counter() - started) * 1000)
    metrics = {
        "model": body.get("model", OLLAMA_MODEL),
        "mode": tutor_mode(mode),
        "duration_ms": duration_ms,
        "prompt_tokens": body.get("prompt_eval_count") or prompt_tokens,
        "response_tokens": body.get("eval_count"),
    }
    result = body.get("message", {}).get("content", "").strip()
    ai_logger.info(
        "AI tutor completed model=%s mode=%s prompt_tokens=%s response_tokens=%s duration_ms=%s",
        metrics["model"], metrics["mode"], metrics["prompt_tokens"],
        metrics["response_tokens"], metrics["duration_ms"],
    )
    _cache_set(prompt, mode, result)
    return result, metrics


def build_student_insights_prompt(analysis: dict) -> str:
    struggling = analysis.get("strugglingStudents", [])[:8]
    weak_topics = analysis.get("classWeakTopics", [])[:6]
    lines = [
        "You are DANILO, an AI assistant for teachers.",
        "",
        "Analyze the following student performance data.",
        "",
        "Output:",
        "- List of students who are struggling",
        "- Weak topics",
        "- Short explanation",
        "- Suggested teacher actions",
        "",
        "Keep it short and practical.",
        "",
        f"Class: {analysis.get('course', {}).get('title', 'Selected class')}",
        f"Stats: {json.dumps(analysis.get('stats', {}), ensure_ascii=True)}",
        "Students:",
    ]
    for student in struggling:
        lines.append(
            f"- {student['studentName']}: {student['status']}, avg={student['averageScore']}, "
            f"weak={student.get('weakestTopic')}, missing={student['missingSubmissionCount']}, "
            f"low_scores={student['lowScoreCount']}, reason={student['explanation']}"
        )
    if not struggling:
        lines.append("- No struggling students detected.")
    lines.append("Weak topics:")
    for topic in weak_topics:
        lines.append(f"- {topic['topic']}: avg={topic.get('averageScore')}, risks={topic.get('riskCount')}")
    return "\n".join(lines)


async def stream_ollama(prompt: str, mode: str, memory: list[dict] | None = None):
    payload = {
        **ollama_chat_payload(prompt, mode, stream=True, memory=memory),
    }
    started = time.perf_counter()
    prompt_tokens = estimate_prompt_tokens(prompt)
    timeout = httpx.Timeout(OLLAMA_TIMEOUT_SECONDS, connect=5.0)
    sem = _AI_SEMAPHORE or asyncio.Semaphore(_AI_MAX_CONCURRENT)
    async with sem:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as response:
                response.raise_for_status()
                full_parts: list[str] = []
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    body = json.loads(line)
                    content = body.get("message", {}).get("content", "")
                    if content:
                        full_parts.append(content)
                        yield {"content": content, "done": False}
                    if body.get("done"):
                        duration_ms = int((time.perf_counter() - started) * 1000)
                        metrics = {
                            "model": body.get("model", OLLAMA_MODEL),
                            "mode": tutor_mode(mode),
                            "duration_ms": duration_ms,
                            "prompt_tokens": body.get("prompt_eval_count") or prompt_tokens,
                            "response_tokens": body.get("eval_count"),
                        }
                        ai_logger.info(
                            "AI tutor streamed model=%s mode=%s prompt_tokens=%s response_tokens=%s duration_ms=%s",
                            metrics["model"], metrics["mode"], metrics["prompt_tokens"],
                            metrics["response_tokens"], metrics["duration_ms"],
                        )
                        full_response = "".join(full_parts).strip()
                        if full_response:
                            _cache_set(prompt, mode, full_response)
                        yield {"content": "", "done": True, "metrics": metrics}


@router.get("/health", tags=["health"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "project-danilo",
        "model": OLLAMA_MODEL,
        "portalDomain": PORTAL_DOMAIN,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@ai_router.get("/ai/status", tags=["health"])
def ai_status() -> dict:
    """Public endpoint to check AI readiness without authentication.
    Used by the frontend to display AI availability before login."""
    ollama_ok = False
    model_loaded = False
    available_models: list[str] = []
    error_message = ""

    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=4.0)
        if r.status_code == 200:
            ollama_ok = True
            available_models = [m.get("name", "") for m in (r.json().get("models") or [])]
            model_loaded = any(
                name == OLLAMA_MODEL or name == f"{OLLAMA_MODEL}:latest"
                for name in available_models
            )
    except Exception as exc:
        error_message = str(exc)[:120]

    ram_available_mb: float | None = None
    if _psutil:
        try:
            vm = _psutil.virtual_memory()
            ram_available_mb = round(vm.available / 1024 / 1024, 1)
        except Exception:
            pass

    return {
        "ollamaOnline": ollama_ok,
        "modelLoaded": model_loaded,
        "modelName": OLLAMA_MODEL,
        "availableModels": available_models,
        "ramAvailableMb": ram_available_mb,
        "queueSlots": _AI_MAX_CONCURRENT,
        "status": "ready" if (ollama_ok and model_loaded) else ("degraded" if ollama_ok else "offline"),
        "errorMessage": error_message or None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/auth/login", tags=["auth"])
def login(payload: dict = Body(default={}), db: Session = Depends(get_db)) -> dict:
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if not username or not password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username and password are required")

    logger.info("Login attempt for username=%s", username)
    try:
        lookup = username.lower()
        user = db.scalar(
            select(User).where(
                or_(func.lower(User.username) == lookup, func.lower(User.email) == lookup)
            )
        )
        if not user or not user.is_active or not verify_password(password, user.password_hash):
            logger.warning("Login failed for username=%s", username)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

        token = create_access_token({"sub": str(user.id), "role": user.role}, JWT_SECRET, JWT_EXPIRE_MINUTES)
        logger.info("Login succeeded for user_id=%s username=%s role=%s", user.id, user.username, user.role)
        if user.role == "admin":
            logger.info("Successful admin login for user_id=%s username=%s", user.id, user.username)
        return {
            "accessToken": token,
            "tokenType": "Bearer",
            "user": serialize_user(user),
            "forcePasswordChange": bool(user.force_password_change),
        }
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        logger.exception("Database error during login for username=%s", username)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login service is temporarily unavailable") from exc


@router.get("/me", tags=["auth"])
def me(current_user: User = Depends(get_current_user)) -> dict:
    logger.info("/api/me accessed by user_id=%s role=%s", current_user.id, current_user.role)
    return serialize_user(current_user)


@router.post("/auth/change-password", tags=["auth"])
def change_password(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    """Allow any authenticated user to change their own password. Clears force_password_change flag."""
    current_password = str(payload.get("currentPassword") or "")
    new_password = str(payload.get("newPassword") or "")
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="currentPassword and newPassword are required")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    if not verify_password(current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    current_user.password_hash = hash_password(new_password)
    current_user.password_salt = ""
    current_user.force_password_change = False
    log_action(db, current_user, "change_password", "user", current_user.id)
    db.commit()
    logger.info("Password changed for user_id=%s username=%s", current_user.id, current_user.username)
    return {"ok": True, "message": "Password changed successfully"}


@router.get("/dashboard", tags=["dashboard"])
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    logger.info("/api/dashboard accessed by user_id=%s role=%s", current_user.id, current_user.role)
    try:
        stream_items = build_stream(db, current_user)
        grade_summary = build_grade_summary(db, current_user.id) if current_user.role == "student" else []
        if current_user.role == "admin":
            courses = build_admin_course_cards(db)
        elif current_user.role == "teacher":
            courses = build_teacher_course_cards(db, current_user.id)
        else:
            courses = build_student_course_cards(db, current_user.id)
        content_items = build_content_tree(db, user=current_user)
        workflow_status = build_content_workflow_status()

        return {
            "user": serialize_user(current_user),
            "stream": stream_items or [],
            "courses": courses or [],
            "contentFolders": content_items or [],
            "grades": grade_summary or [],
            "hints": {
                "hasContent": bool(content_items),
                "hasCourses": bool(courses),
                "hasGrades": bool(grade_summary),
                "hasStream": bool(stream_items),
            },
            "contentWorkflow": workflow_status,
            "network": {
                "ssid": SSID,
                "portal": f"http://{PORTAL_DOMAIN}",
                "mode": "offline-first captive portal",
            },
            "operationsHighlights": [
                {"label": "Portal", "value": f"http://{PORTAL_DOMAIN}"},
                {"label": "SSID", "value": SSID},
                {"label": "AI Model", "value": OLLAMA_MODEL},
            ],
        }
    except SQLAlchemyError as exc:
        logger.exception("Dashboard database error for user_id=%s role=%s", current_user.id, current_user.role)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dashboard data is temporarily unavailable") from exc
    except Exception as exc:
        logger.exception("Dashboard error for user_id=%s role=%s", current_user.id, current_user.role)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dashboard could not be loaded") from exc


@router.get("/stream", tags=["dashboard"])
def stream(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    return build_stream(db, current_user)


@router.get("/content", tags=["content"])
def content(
    query: str | None = None,
    quarter: str | None = None,
    subject: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    return build_content_tree(db, user=current_user, query=query, quarter=quarter, subject=subject)


@router.get("/content/workflow", tags=["content"])
def content_workflow(current_user: User = Depends(get_current_user)) -> dict:
    _ = current_user
    return build_content_workflow_status()


@router.get("/grades", tags=["grades"])
def grades(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Grades are only available to student accounts")
    return build_grade_summary(db, current_user.id)


@admin_router.get("/admin/overview")
def admin_overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    learner_count = db.query(User).filter(User.role == "student").count()
    faculty_count = db.query(User).filter(User.role == "teacher").count()
    admin_count = db.query(User).filter(User.role == "admin").count()
    active_courses = db.query(Course).filter(Course.is_active == True).count()
    enrollment_count = db.query(Enrollment).filter(Enrollment.status == "active").count()
    module_count = db.query(Module).count()
    grade_count = db.query(GradeEntry).count()
    section_count = db.query(Section).filter(Section.is_active == True).count()
    dept_count = db.query(Department).filter(Department.is_active == True).count()
    chat_session_count = db.query(ChatSession).count()
    chat_message_count = db.query(ChatMessage).count()
    ai_convo_count = db.query(AIConversation).count()
    return {
        "totals": {
            "learners": learner_count,
            "faculty": faculty_count,
            "admins": admin_count,
            "classes": active_courses,
            "enrollments": enrollment_count,
            "modules": module_count,
            "grades": grade_count,
            "sections": section_count,
            "departments": dept_count,
            "chatSessions": chat_session_count,
            "chatMessages": chat_message_count,
            "aiConversations": ai_convo_count,
        },
        "system": {
            "portalUrl": f"http://{PORTAL_DOMAIN}",
            "wifiSsid": SSID,
            "aiModel": OLLAMA_MODEL,
            "database": "connected",
            "mode": "LAN offline-first",
        },
        "courses": build_admin_course_cards(db),
        "stream": build_stream(db, current_user),
        "contentFolders": build_content_tree(db, user=current_user),
        "network": {
            "ssid": SSID,
            "portal": f"http://{PORTAL_DOMAIN}",
            "mode": "offline-first captive portal",
        },
        "operationsHighlights": [
            {"label": "Portal", "value": f"http://{PORTAL_DOMAIN}"},
            {"label": "SSID", "value": SSID},
            {"label": "AI Model", "value": OLLAMA_MODEL},
        ],
    }


@admin_router.get("/admin/users")
def admin_users(role: str | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    stmt = select(User).order_by(User.role.asc(), User.full_name.asc())
    if role:
        stmt = stmt.where(User.role == role)
    return [serialize_user(user) for user in db.scalars(stmt).all()]


@admin_router.post("/admin/users")
def admin_create_user(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    role = clean_text(payload.get("role"), max_length=20)
    if role not in {"admin", "teacher", "student"}:
        raise HTTPException(status_code=400, detail="Role must be admin, teacher, or student")
    full_name = clean_text(payload.get("fullName") or payload.get("full_name"), max_length=255)
    education_level = clean_text(payload.get("educationLevel") or payload.get("education_level"), required=False, max_length=40)
    grade_level = clean_text(payload.get("gradeLevel") or payload.get("grade_level"), required=False, max_length=50)
    strand = clean_text(payload.get("strand"), required=False, max_length=80)
    if role == "student" or education_level or grade_level or strand:
        education_level, grade_level, strand = validate_grade_path(education_level, grade_level, strand)
    section_name_val = clean_text(payload.get("sectionName") or payload.get("section_name"), required=False, max_length=120)
    username_override = clean_text(payload.get("username"), required=False, max_length=120)
    username = username_override.upper() if username_override else unique_local_username(db, generated_username_from_name(full_name, role, section_name_val))
    email = clean_text(payload.get("email"), required=False, max_length=255) or f"{username}@danilo.local"
    if db.scalar(select(User).where(or_(func.lower(User.username) == username.lower(), func.lower(User.email) == email.lower()))):
        raise HTTPException(status_code=409, detail="Username or email already exists")
    password = clean_text(payload.get("password") or "danilo123", max_length=255)
    department_id = parse_int(payload.get("departmentId") or payload.get("department_id"), "Department", required=False, minimum=1)
    if department_id and not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True)):
        raise HTTPException(status_code=400, detail="Department not found")
    user = User(role=role, username=username, email=email, full_name=full_name, education_level=education_level, grade_level=grade_level, strand=strand, section_name=section_name_val, department_id=department_id, password_salt="", password_hash=hash_password(password), is_active=parse_bool(payload.get("isActive"), "Active status", default=True))
    db.add(user)
    db.flush()
    if user.role == "student" and section_name_val:
        enrolled_course_ids = db.scalars(
            select(Enrollment.course_id).distinct()
            .join(User, Enrollment.student_id == User.id)
            .where(
                func.lower(User.section_name) == section_name_val.lower(),
                User.role == "student",
                User.is_active == True,
                Enrollment.status == "active",
                User.id != user.id,
            )
        ).all()
        for cid in enrolled_course_ids:
            db.add(Enrollment(course_id=cid, student_id=user.id, status="active"))
    log_action(db, current_user, "create_user", "user", user.id, user.role)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@admin_router.put("/admin/users/{user_id}")
def admin_update_user(user_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if "role" in payload and payload["role"] in {"admin", "teacher", "student"}:
        user.role = payload["role"]
    for attr, key, limit in [("username", "username", 120), ("email", "email", 255), ("full_name", "fullName", 255), ("education_level", "educationLevel", 40), ("grade_level", "gradeLevel", 50), ("strand", "strand", 80), ("section_name", "sectionName", 120)]:
        if key in payload:
            setattr(user, attr, clean_text(payload.get(key), required=attr not in {"education_level", "grade_level", "strand", "section_name"}, max_length=limit))
    if "departmentId" in payload or "department_id" in payload:
        department_id = parse_int(payload.get("departmentId") or payload.get("department_id"), "Department", required=False, minimum=1)
        if department_id and not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True)):
            raise HTTPException(status_code=400, detail="Department not found")
        user.department_id = department_id
    if {"educationLevel", "gradeLevel", "strand"} & set(payload.keys()):
        user.education_level, user.grade_level, user.strand = validate_grade_path(user.education_level, user.grade_level, user.strand)
    if "isActive" in payload:
        user.is_active = parse_bool(payload["isActive"], "Active status")
    log_action(db, current_user, "update_user", "user", user.id)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@admin_router.delete("/admin/users/{user_id}")
def admin_delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete the active session account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    log_action(db, current_user, "deactivate_user", "user", user.id)
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_password = clean_text(payload.get("password") or "danilo123", max_length=255)
    user.password_hash = hash_password(new_password)
    user.password_salt = ""
    log_action(db, current_user, "reset_password", "user", user.id)
    db.commit()
    return {"ok": True, "message": "Password reset"}


@admin_router.delete("/admin/users/{user_id}/permanent")
def admin_permanent_delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete the active session account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.execute(text("DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = :uid)"), {"uid": user_id})
    db.execute(text("DELETE FROM chat_sessions WHERE user_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM ai_conversations WHERE student_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM grade_entries WHERE student_id = :uid"), {"uid": user_id})
    db.execute(text("UPDATE grade_entries SET recorded_by = :admin_id WHERE recorded_by = :uid"), {"admin_id": current_user.id, "uid": user_id})
    db.execute(text("DELETE FROM submissions WHERE student_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE student_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM enrollments WHERE student_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM stream_posts WHERE author_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM audit_logs WHERE actor_id = :uid"), {"uid": user_id})
    db.execute(text("UPDATE courses SET teacher_id = NULL WHERE teacher_id = :uid"), {"uid": user_id})
    db.execute(text("UPDATE sections SET adviser_id = NULL WHERE adviser_id = :uid"), {"uid": user_id})
    db.execute(text("UPDATE assignments SET created_by = :admin_id WHERE created_by = :uid"), {"admin_id": current_user.id, "uid": user_id})
    db.execute(text("UPDATE quizzes SET created_by = :admin_id WHERE created_by = :uid"), {"admin_id": current_user.id, "uid": user_id})
    db.delete(user)
    log_action(db, current_user, "permanent_delete_user", "user", user_id)
    db.commit()
    return {"ok": True}


@admin_router.get("/admin/sections")
def admin_sections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    sections = db.scalars(select(Section).where(Section.is_active == True).order_by(Section.grade_level.asc(), Section.name.asc())).all()
    result = []
    for section in sections:
        student_count = db.query(User).filter(User.section_name == section.name, User.role == "student", User.is_active == True).count()
        result.append({
            "id": section.id, "name": section.name, "gradeLevel": section.grade_level,
            "educationLevel": section.education_level, "strand": section.strand,
            "schoolYear": section.school_year, "adviserId": section.adviser_id,
            "adviserName": section.adviser.full_name if section.adviser else "Unassigned",
            "studentCount": student_count, "isActive": section.is_active,
        })
    return result


@admin_router.post("/admin/sections")
def admin_create_section(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    education_level, grade_level, strand = validate_grade_path(
        clean_text(payload.get("educationLevel") or "Junior High School", max_length=40),
        clean_text(payload.get("gradeLevel") or "Grade 7", max_length=50),
        clean_text(payload.get("strand"), required=False, max_length=80),
    )
    adviser_id = parse_int(payload.get("adviserId") or payload.get("adviser_id"), "Adviser", required=False, minimum=1)
    if adviser_id and not db.scalar(select(User).where(User.id == adviser_id, User.role == "teacher")):
        raise HTTPException(status_code=400, detail="Adviser must be a teacher account")
    section = Section(
        name=clean_text(payload.get("name"), max_length=120),
        grade_level=grade_level, education_level=education_level, strand=strand,
        school_year=clean_text(payload.get("schoolYear") or "2026-2027", max_length=20),
        adviser_id=adviser_id, is_active=True,
    )
    db.add(section)
    log_action(db, current_user, "create_section", "section", None, section.name)
    db.commit()
    db.refresh(section)
    return {"ok": True, "id": section.id}


@admin_router.put("/admin/sections/{section_id}")
def admin_update_section(section_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    if "name" in payload:
        section.name = clean_text(payload["name"], max_length=120)
    if "gradeLevel" in payload or "educationLevel" in payload or "strand" in payload:
        section.education_level, section.grade_level, section.strand = validate_grade_path(
            clean_text(payload.get("educationLevel") or section.education_level, max_length=40),
            clean_text(payload.get("gradeLevel") or section.grade_level, max_length=50),
            clean_text(payload.get("strand") or section.strand, required=False, max_length=80),
        )
    if "adviserId" in payload:
        adviser_id = parse_int(payload["adviserId"], "Adviser", required=False, minimum=1)
        if adviser_id and not db.scalar(select(User).where(User.id == adviser_id, User.role == "teacher")):
            raise HTTPException(status_code=400, detail="Adviser must be a teacher account")
        section.adviser_id = adviser_id
    if "isActive" in payload:
        section.is_active = parse_bool(payload["isActive"], "Active status")
    log_action(db, current_user, "update_section", "section", section.id)
    db.commit()
    return {"ok": True}


@admin_router.delete("/admin/sections/{section_id}")
def admin_delete_section(section_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    section = db.get(Section, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    section.is_active = False
    log_action(db, current_user, "deactivate_section", "section", section.id)
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/sections/{section_id}/assign-students")
def admin_assign_students_to_section(section_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    section = db.get(Section, section_id)
    if not section or not section.is_active:
        raise HTTPException(status_code=404, detail="Section not found")
    student_ids = payload.get("studentIds") or payload.get("student_ids") or []
    updated = 0
    for sid in student_ids:
        student_id = parse_int(sid, "Student", minimum=1)
        student = db.get(User, student_id)
        if student and student.role == "student":
            student.section_name = section.name
            updated += 1
    log_action(db, current_user, "assign_students_to_section", "section", section.id, f"count={updated}")
    db.commit()
    return {"ok": True, "updated": updated}


@admin_router.get("/admin/courses")
def admin_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    return build_admin_course_cards(db)


@admin_router.post("/admin/courses")
def admin_create_course(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    teacher_id = parse_int(payload.get("teacherId") or payload.get("teacher_id"), "Faculty", required=False, minimum=1)
    if teacher_id and not db.scalar(select(User).where(User.id == teacher_id, User.role == "teacher")):
        raise HTTPException(status_code=400, detail="Teacher account not found")
    department_id = parse_int(payload.get("departmentId") or payload.get("department_id"), "Department", required=False, minimum=1)
    if department_id and not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True)):
        raise HTTPException(status_code=400, detail="Department not found")
    education_level, grade_level, strand = validate_grade_path(
        clean_text(payload.get("educationLevel") or payload.get("education_level") or "Junior High School", max_length=40),
        clean_text(payload.get("gradeLevel") or payload.get("grade_level") or "Grade 7", max_length=50),
        clean_text(payload.get("strand"), required=False, max_length=80),
    )
    course = Course(code=clean_text(payload.get("code"), max_length=50), title=clean_text(payload.get("title"), max_length=255), subject=validate_deped_subject(payload.get("subject")), education_level=education_level, grade_level=grade_level, strand=strand, quarter=validate_quarter(payload.get("quarter")), school_year=clean_text(payload.get("schoolYear") or payload.get("school_year") or "2026-2027", max_length=20), description=clean_text(payload.get("description") or "Offline-ready DANILO class.", max_length=1000), teacher_id=teacher_id, department_id=department_id, is_active=True)
    db.add(course)
    db.flush()
    log_action(db, current_user, "create_course", "course", course.id)
    db.commit()
    return serialize_course(course)


@admin_router.put("/admin/courses/{course_id}")
def admin_update_course(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Class not found")
    for attr, key, limit in [("code", "code", 50), ("title", "title", 255), ("education_level", "educationLevel", 40), ("grade_level", "gradeLevel", 50), ("strand", "strand", 80), ("school_year", "schoolYear", 20), ("description", "description", 1000)]:
        if key in payload:
            setattr(course, attr, clean_text(payload.get(key), required=attr != "strand", max_length=limit))
    if "subject" in payload:
        course.subject = validate_deped_subject(payload.get("subject"))
    if "quarter" in payload:
        course.quarter = validate_quarter(payload.get("quarter"))
    if "teacherId" in payload or "teacher_id" in payload:
        teacher_id = parse_int(payload.get("teacherId") or payload.get("teacher_id"), "Faculty", required=False, minimum=1)
        if teacher_id and not db.scalar(select(User).where(User.id == teacher_id, User.role == "teacher")):
            raise HTTPException(status_code=400, detail="Teacher account not found")
        course.teacher_id = teacher_id
    if "departmentId" in payload or "department_id" in payload:
        department_id = parse_int(payload.get("departmentId") or payload.get("department_id"), "Department", required=False, minimum=1)
        if department_id and not db.scalar(select(Department).where(Department.id == department_id, Department.is_active == True)):
            raise HTTPException(status_code=400, detail="Department not found")
        course.department_id = department_id
    if {"educationLevel", "gradeLevel", "strand"} & set(payload.keys()):
        course.education_level, course.grade_level, course.strand = validate_grade_path(course.education_level, course.grade_level, course.strand)
    if "isActive" in payload:
        course.is_active = parse_bool(payload["isActive"], "Active status")
    log_action(db, current_user, "update_course", "course", course.id)
    db.commit()
    return {"ok": True}


@admin_router.delete("/admin/courses/{course_id}")
def admin_delete_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Class not found")
    course.is_active = False
    log_action(db, current_user, "deactivate_course", "course", course.id)
    db.commit()
    return {"ok": True}


@admin_router.delete("/admin/courses/{course_id}/permanent")
def admin_permanent_delete_course(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Class not found")
    db.execute(text("DELETE FROM ai_conversations WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM grade_entries WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = :cid)"), {"cid": course_id})
    db.execute(text("DELETE FROM assignments WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = :cid)"), {"cid": course_id})
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = :cid)"), {"cid": course_id})
    db.execute(text("DELETE FROM quizzes WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM enrollments WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM stream_posts WHERE course_id = :cid"), {"cid": course_id})
    db.execute(text("DELETE FROM modules WHERE course_id = :cid"), {"cid": course_id})
    db.delete(course)
    log_action(db, current_user, "permanent_delete_course", "course", course_id)
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/courses/{course_id}/enroll")
def admin_enroll_student(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    student_id = parse_int(payload.get("studentId") or payload.get("student_id"), "Student", minimum=1)
    if not db.scalar(select(User).where(User.id == student_id, User.role == "student")):
        raise HTTPException(status_code=400, detail="Student account not found")
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if enrollment:
        enrollment.status = "active"
    else:
        db.add(Enrollment(course_id=course_id, student_id=student_id, status="active"))
    log_action(db, current_user, "enroll_student", "course", course_id, str(student_id))
    db.commit()
    return {"ok": True}


@admin_router.delete("/admin/courses/{course_id}/enroll/{student_id}")
def admin_unenroll_student(course_id: int, student_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    enrollment = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    enrollment.status = "inactive"
    log_action(db, current_user, "unenroll_student", "course", course_id, str(student_id))
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/courses/{course_id}/assign-teacher")
def admin_assign_teacher(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    teacher_id = parse_int(payload.get("teacherId") or payload.get("teacher_id"), "Faculty", minimum=1)
    if not db.scalar(select(User).where(User.id == teacher_id, User.role == "teacher")):
        raise HTTPException(status_code=400, detail="Teacher account not found")
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Class not found")
    course.teacher_id = teacher_id
    log_action(db, current_user, "assign_teacher", "course", course.id, str(teacher_id))
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/announcements")
def admin_system_announcement(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    title = clean_text(payload.get("title"), max_length=255)
    body = clean_text(payload.get("body"), max_length=2000)
    courses = db.scalars(select(Course).where(Course.is_active == True)).all()
    for course in courses:
        db.add(StreamPost(course_id=course.id, author_id=current_user.id, title=title, body=body, post_type="announcement"))
    log_action(db, current_user, "system_announcement", "stream_post", details=title)
    db.commit()
    return {"ok": True, "postedToClasses": len(courses)}


@admin_router.get("/admin/reports/roster")
def admin_roster_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    require_role(current_user, "admin")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["course_code", "course_title", "teacher", "student_username", "student_name", "status"])
    data = db.execute(select(Course, Enrollment, User).join(Enrollment, Enrollment.course_id == Course.id).join(User, Enrollment.student_id == User.id).order_by(Course.code, User.full_name)).all()
    for course, enrollment, student in data:
        teacher = course.teacher.full_name if course.teacher else "Unassigned"
        writer.writerow([course.code, course.title, teacher, student.username, student.full_name, enrollment.status])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=danilo-roster.csv"})


@admin_router.get("/admin/reports/grades")
def admin_grades_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    require_role(current_user, "admin")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["course_code", "student_username", "student_name", "quarter", "component", "score", "max_score", "weight", "remarks"])
    data = db.execute(select(GradeEntry, Course, User).join(Course, GradeEntry.course_id == Course.id).join(User, GradeEntry.student_id == User.id).order_by(Course.code, User.full_name)).all()
    for grade, course, student in data:
        writer.writerow([course.code, student.username, student.full_name, grade.quarter, grade.component, grade.score, grade.max_score, grade.weight, grade.remarks or ""])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=danilo-grades.csv"})


@teacher_router.get("/teacher/dashboard")
def teacher_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "teacher")
    courses = build_teacher_course_cards(db, current_user.id)
    return {
        "user": serialize_user(current_user),
        "courses": courses,
        "totals": {"classes": len(courses), "students": sum(item["studentTotal"] for item in courses), "modules": sum(item["moduleTotal"] for item in courses)},
        "stream": build_stream(db, current_user),
        "contentFolders": build_content_tree(db, user=current_user),
        "network": {"ssid": SSID, "portal": f"http://{PORTAL_DOMAIN}", "mode": "offline-first captive portal"},
        "operationsHighlights": [
            {"label": "Portal", "value": f"http://{PORTAL_DOMAIN}"},
            {"label": "SSID", "value": SSID},
            {"label": "AI Model", "value": OLLAMA_MODEL},
        ],
    }


@teacher_router.get("/teacher/courses")
def teacher_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "teacher")
    return build_teacher_course_cards(db, current_user.id)


@teacher_router.get("/teacher/courses/{course_id}/students")
def teacher_course_students(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    ensure_teacher_course(db, current_user, course_id)
    rows = db.execute(select(User, Enrollment).join(Enrollment, Enrollment.student_id == User.id).where(Enrollment.course_id == course_id, Enrollment.status == "active").order_by(User.full_name)).all()
    return [{**serialize_user(student), "enrollmentStatus": enrollment.status} for student, enrollment in rows]


@teacher_router.post("/teacher/courses/{course_id}/announcements")
def teacher_create_announcement(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    post = StreamPost(course_id=course.id, author_id=current_user.id, title=clean_text(payload.get("title"), max_length=255), body=clean_text(payload.get("body"), max_length=2000), post_type="announcement")
    db.add(post)
    db.commit()
    return {"ok": True, "id": post.id}


@teacher_router.post("/teacher/courses/{course_id}/modules")
def teacher_create_module(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    module = Module(
        course_id=course.id,
        melc_code=clean_text(payload.get("melcCode") or payload.get("melc_code") or "TEACHER-CREATED", max_length=120),
        learning_competency=clean_text(payload.get("learningCompetency") or payload.get("learning_competency"), required=False, max_length=2000),
        lesson_objectives=clean_text(payload.get("lessonObjectives") or payload.get("lesson_objectives"), required=False, max_length=2000),
        assessment_type=validate_assessment_type(payload.get("assessmentType") or payload.get("assessment_type")),
        grade_level=course.grade_level,
        subject=course.subject,
        quarter=validate_quarter(payload.get("quarter") or course.quarter),
        week=parse_int(payload.get("week") or 1, "Week", minimum=1),
        sequence_order=parse_int(payload.get("sequenceOrder") or payload.get("sequence_order") or 1, "Sequence order", minimum=1),
        folder_name=clean_text(payload.get("folderName") or payload.get("folder_name") or f"{course.code}/Lessons", max_length=255),
        title=clean_text(payload.get("title"), max_length=255),
        summary=clean_text(payload.get("summary") or "Teacher-created lesson module.", max_length=2000),
        essential_question=clean_text(payload.get("essentialQuestion") or payload.get("essential_question") or "What will you learn from this lesson?", max_length=1000),
        content=clean_text(payload.get("content"), required=False, max_length=5000),
        file_url=clean_text(payload.get("fileUrl") or payload.get("file_url"), required=False, max_length=500),
    )
    db.add(module)
    log_action(db, current_user, "create_module", "module", None, f"course={course.code}")
    db.commit()
    db.refresh(module)
    return {"ok": True, "id": module.id}


@teacher_router.post("/teacher/courses/{course_id}/materials/generate")
async def teacher_generate_lesson_from_material(course_id: int, material: UploadFile = File(...), save: bool = True, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    filename = clean_text(material.filename or "uploaded-material.txt", max_length=255)
    data = await material.read()
    extracted = extract_material_text(filename, data)
    lesson = generated_lesson_from_text(course, filename, extracted)

    module_id = None
    if save:
        module = Module(
            course_id=course.id,
            melc_code=lesson["melcCode"],
            learning_competency=lesson["learningCompetency"],
            lesson_objectives=lesson["lessonObjectives"],
            assessment_type=lesson["assessmentType"],
            grade_level=course.grade_level,
            subject=course.subject,
            quarter=lesson["quarter"],
            week=lesson["week"],
            sequence_order=lesson["sequenceOrder"],
            folder_name=lesson["folderName"],
            title=lesson["title"],
            summary=lesson["summary"],
            essential_question=lesson["essentialQuestion"],
            content=lesson["content"],
            file_url=None,
        )
        db.add(module)
        db.add(StreamPost(course_id=course.id, author_id=current_user.id, title=f"New lesson: {lesson['title']}", body="A teacher-editable AI-generated lesson draft was added from uploaded material.", post_type="lesson"))
        log_action(db, current_user, "generate_lesson_from_material", "module", None, f"source={filename}")
        db.commit()
        db.refresh(module)
        module_id = module.id

    return {
        "ok": True,
        "id": module_id,
        "lesson": lesson,
        "extractedChars": len(extracted),
        "message": "Lesson generated. Review and edit before teaching.",
    }


@teacher_router.put("/teacher/modules/{module_id}")
def teacher_update_module(module_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    ensure_teacher_course(db, current_user, module.course_id)
    for attr, key, limit in [("title", "title", 255), ("summary", "summary", 2000), ("essential_question", "essentialQuestion", 1000), ("learning_competency", "learningCompetency", 2000), ("lesson_objectives", "lessonObjectives", 2000), ("content", "content", 5000), ("file_url", "fileUrl", 500), ("melc_code", "melcCode", 120), ("folder_name", "folderName", 255)]:
        if key in payload:
            setattr(module, attr, clean_text(payload.get(key), required=attr not in {"content", "file_url"}, max_length=limit))
    if "quarter" in payload:
        module.quarter = validate_quarter(payload.get("quarter"))
    if "assessmentType" in payload:
        module.assessment_type = validate_assessment_type(payload.get("assessmentType"))
    for attr, key in [("week", "week"), ("sequence_order", "sequenceOrder")]:
        if key in payload:
            setattr(module, attr, parse_int(payload.get(key), "Sequence field", minimum=1))
    db.commit()
    return {"ok": True}


@teacher_router.delete("/teacher/modules/{module_id}")
def teacher_delete_module(module_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    ensure_teacher_course(db, current_user, module.course_id)
    db.delete(module)
    db.commit()
    return {"ok": True}


@teacher_router.post("/teacher/courses/{course_id}/assignments")
def teacher_create_assignment(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    assignment = Assignment(course_id=course.id, title=clean_text(payload.get("title"), max_length=255), instructions=clean_text(payload.get("instructions"), max_length=4000), points=parse_float(payload.get("points") or 100, "Points", minimum=1), created_by=current_user.id)
    db.add(assignment)
    db.add(StreamPost(course_id=course.id, author_id=current_user.id, title=assignment.title, body=assignment.instructions, post_type="assignment"))
    db.commit()
    return {"ok": True, "id": assignment.id}


@teacher_router.put("/teacher/assignments/{assignment_id}")
def teacher_update_assignment(assignment_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    ensure_teacher_course(db, current_user, assignment.course_id)
    for attr, key, limit in [("title", "title", 255), ("instructions", "instructions", 4000)]:
        if key in payload:
            setattr(assignment, attr, clean_text(payload.get(key), max_length=limit))
    if "points" in payload:
        assignment.points = parse_float(payload.get("points"), "Points", minimum=1)
    if "isActive" in payload:
        assignment.is_active = parse_bool(payload.get("isActive"), "Active status")
    db.commit()
    return {"ok": True}


@teacher_router.delete("/teacher/assignments/{assignment_id}")
def teacher_delete_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    ensure_teacher_course(db, current_user, assignment.course_id)
    assignment.is_active = False
    db.commit()
    return {"ok": True}


@teacher_router.post("/teacher/courses/{course_id}/quizzes")
def teacher_create_quiz(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    quiz = Quiz(course_id=course.id, title=clean_text(payload.get("title") or "Class Quiz", max_length=255), instructions=clean_text(payload.get("instructions") or "Answer each question based on the current lesson.", max_length=2000), is_published=parse_bool(payload.get("isPublished"), "Published status", default=False), created_by=current_user.id)
    db.add(quiz)
    db.flush()
    for item in payload.get("questions") or []:
        db.add(QuizQuestion(quiz_id=quiz.id, question_text=clean_text(item.get("questionText") or item.get("question"), max_length=2000), choices_json=clean_text(item.get("choicesJson"), required=False, max_length=4000), answer_key=clean_text(item.get("answerKey"), required=False, max_length=1000), points=parse_float(item.get("points") or 1, "Question points", minimum=1)))
    db.commit()
    return {"ok": True, "id": quiz.id}


@teacher_router.get("/teacher/courses/{course_id}/gradebook")
def teacher_gradebook(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = ensure_teacher_course(db, current_user, course_id)
    students = teacher_course_students(course_id, current_user, db)
    grades = db.execute(select(GradeEntry, User).join(User, GradeEntry.student_id == User.id).where(GradeEntry.course_id == course_id).order_by(User.full_name, GradeEntry.created_at)).all()
    by_student: dict[int, list[GradeEntry]] = {}
    names: dict[int, str] = {}
    for grade, student in grades:
        by_student.setdefault(student.id, []).append(grade)
        names[student.id] = student.full_name
    summaries = []
    for student_id, rows in by_student.items():
        for item in summarize_grade_entries(course, rows, names.get(student_id)):
            item["studentId"] = student_id
            summaries.append(item)
    return {"course": serialize_course(course), "students": students, "entries": [{"id": grade.id, "studentId": student.id, "studentName": student.full_name, "quarter": grade.quarter, "component": grade.component, "score": grade.score, "maxScore": grade.max_score, "weight": grade.weight, "remarks": grade.remarks or ""} for grade, student in grades], "grades": summaries}


@teacher_router.get("/teacher/insights")
async def teacher_student_insights(
    class_id: int | None = None,
    subject: str | None = None,
    include_ai: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    require_role(current_user, "teacher")
    stmt = select(Course).where(Course.is_active == True, Course.teacher_id == current_user.id)
    if subject:
        stmt = stmt.where(Course.subject == subject)
    if class_id:
        stmt = stmt.where(Course.id == class_id)
    course = db.scalars(stmt.order_by(Course.subject.asc(), Course.title.asc())).first()
    if not course:
        return {
            "course": None,
            "students": [],
            "strugglingStudents": [],
            "classWeakTopics": [],
            "stats": {"studentCount": 0, "strugglingCount": 0, "atRiskCount": 0, "needsAttentionCount": 0, "classAverage": None, "missingSubmissions": 0},
            "aiSummary": "No class data available for the selected filters.",
            "aiStatus": "skipped",
        }

    analysis = analyze_student_performance(db, course.id)
    analysis["availableClasses"] = build_admin_course_cards(db) if current_user.role == "admin" else build_teacher_course_cards(db, current_user.id)
    analysis["availableSubjects"] = sorted({item["subject"] for item in analysis["availableClasses"] if item.get("subject")})
    analysis["aiSummary"] = ""
    analysis["aiStatus"] = "skipped"
    if include_ai:
        try:
            ai_summary, metrics = await ask_ollama(build_student_insights_prompt(analysis), "short")
            analysis["aiSummary"] = ai_summary or "DANILO did not return additional recommendations."
            analysis["aiStatus"] = "ready"
            analysis["aiMetrics"] = metrics
        except Exception:
            logger.exception("Ollama failed while generating student insights for course_id=%s", course.id)
            analysis["aiSummary"] = "DANILO Tutor is offline or still getting ready. Deterministic insights are shown below."
            analysis["aiStatus"] = "offline"
    return analysis


@teacher_router.post("/teacher/courses/{course_id}/grades")
def teacher_create_grade(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    ensure_teacher_course(db, current_user, course_id)
    student_id = parse_int(payload.get("studentId") or payload.get("student_id"), "Student", minimum=1)
    if not db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id, Enrollment.status == "active")):
        raise HTTPException(status_code=400, detail="Student is not enrolled in this class")
    grade = GradeEntry(student_id=student_id, course_id=course_id, quarter=validate_quarter(payload.get("quarter") or "Q1"), component=clean_text(payload.get("component"), max_length=80), score=parse_float(payload.get("score"), "Score", minimum=0), max_score=parse_float(payload.get("maxScore") or payload.get("max_score") or 100, "Max score", minimum=1), weight=parse_float(payload.get("weight") or 1, "Weight", minimum=0), remarks=clean_text(payload.get("remarks"), required=False, max_length=1000), recorded_by=current_user.id)
    db.add(grade)
    db.commit()
    return {"ok": True, "id": grade.id}


@teacher_router.put("/teacher/grades/{grade_id}")
def teacher_update_grade(grade_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    grade = db.get(GradeEntry, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    ensure_teacher_course(db, current_user, grade.course_id)
    for attr, key in [("quarter", "quarter"), ("component", "component"), ("remarks", "remarks")]:
        if key in payload:
            if attr == "quarter":
                grade.quarter = validate_quarter(payload.get(key))
            else:
                setattr(grade, attr, clean_text(payload.get(key), required=attr != "remarks", max_length=1000 if attr == "remarks" else 80))
    for attr, key in [("score", "score"), ("max_score", "maxScore"), ("weight", "weight")]:
        if key in payload:
            minimum = 1 if attr == "max_score" else 0
            setattr(grade, attr, parse_float(payload.get(key), key, minimum=minimum))
    db.commit()
    return {"ok": True}


@teacher_router.delete("/teacher/grades/{grade_id}")
def teacher_delete_grade(grade_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    grade = db.get(GradeEntry, grade_id)
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    ensure_teacher_course(db, current_user, grade.course_id)
    db.delete(grade)
    db.commit()
    return {"ok": True}


@student_router.get("/student/dashboard")
def student_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "student")
    return {"user": serialize_user(current_user), "courses": build_student_course_cards(db, current_user.id), "grades": build_grade_summary(db, current_user.id), "assignments": student_assignments(current_user, db)}


@student_router.get("/student/courses")
def student_courses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "student")
    return build_student_course_cards(db, current_user.id)


@student_router.get("/student/grades")
def student_grades(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "student")
    return build_grade_summary(db, current_user.id)


@student_router.get("/student/assignments")
def student_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "student")
    rows = db.execute(select(Assignment, Course).join(Course, Assignment.course_id == Course.id).join(Enrollment, Enrollment.course_id == Course.id).where(Enrollment.student_id == current_user.id, Enrollment.status == "active", Assignment.is_active == True).order_by(Assignment.created_at.desc())).all()
    submissions = {item.assignment_id: item for item in db.scalars(select(Submission).where(Submission.student_id == current_user.id)).all()}
    return [{"id": assignment.id, "courseId": course.id, "courseCode": course.code, "courseTitle": course.title, "title": assignment.title, "instructions": assignment.instructions, "points": assignment.points, "status": submissions.get(assignment.id).status if submissions.get(assignment.id) else "not_started", "responseText": submissions.get(assignment.id).response_text if submissions.get(assignment.id) else ""} for assignment, course in rows]


@student_router.post("/student/assignments/{assignment_id}/submit")
def student_submit_assignment(assignment_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "student")
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    ensure_student_enrolled(db, current_user, assignment.course_id)
    submission = db.scalar(select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id))
    if not submission:
        submission = Submission(assignment_id=assignment_id, student_id=current_user.id)
        db.add(submission)
    submission.response_text = clean_text(payload.get("responseText") or payload.get("response_text"), max_length=6000)
    submission.status = "submitted"
    db.commit()
    return {"ok": True, "submission": {"status": submission.status, "responseText": submission.response_text, "score": submission.score, "feedback": submission.feedback or ""}}


@student_router.post("/student/assignments/{assignment_id}/complete")
def student_complete_assignment(assignment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "student")
    assignment = db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    ensure_student_enrolled(db, current_user, assignment.course_id)
    submission = db.scalar(select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == current_user.id))
    if not submission:
        submission = Submission(assignment_id=assignment_id, student_id=current_user.id)
        db.add(submission)
    submission.status = "completed"
    db.commit()
    return {"ok": True, "submission": {"status": submission.status, "responseText": submission.response_text or "", "score": submission.score, "feedback": submission.feedback or ""}}


@student_router.post("/student/quizzes/{quiz_id}/submit")
def student_submit_quiz(quiz_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "student")
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not quiz.is_published:
        raise HTTPException(status_code=400, detail="Quiz is not yet published")
    ensure_student_enrolled(db, current_user, quiz.course_id)

    questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.id.asc())).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    answers = payload.get("answers") or {}
    total_points = 0.0
    earned_points = 0.0
    per_question = []

    for question in questions:
        total_points += question.points or 1
        given = str(answers.get(str(question.id), "")).strip().lower()
        expected = str(question.answer_key or "").strip().lower()
        correct = expected and given == expected
        if correct:
            earned_points += question.points or 1
        per_question.append({
            "questionId": question.id,
            "questionText": question.question_text[:120],
            "givenAnswer": given,
            "correctAnswer": expected,
            "correct": correct,
            "points": question.points or 1,
        })

    score_pct = round((earned_points / total_points) * 100, 1) if total_points > 0 else 0.0

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        answers_json=json.dumps(answers),
        score=score_pct,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "ok": True,
        "attemptId": attempt.id,
        "score": score_pct,
        "earnedPoints": earned_points,
        "totalPoints": total_points,
        "questions": per_question,
    }


@classes_router.get("/classes/{course_id}")
def class_detail(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    return serialize_course(course)


@classes_router.get("/classes/{course_id}/stream")
def class_stream(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    course = get_user_class(db, current_user, course_id)
    rows = db.execute(select(StreamPost, User).join(User, StreamPost.author_id == User.id).where(StreamPost.course_id == course.id).order_by(StreamPost.created_at.desc())).all()
    return [{"id": post.id, "title": post.title, "body": post.body, "postType": post.post_type, "createdAt": post.created_at.isoformat() if post.created_at else "", "courseId": course.id, "courseCode": course.code, "courseTitle": course.title, "authorName": author.full_name} for post, author in rows]


@classes_router.get("/classes/{course_id}/classwork")
def class_classwork(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    modules = build_content_tree(db, user=current_user)
    modules = [item for item in modules if item["courseId"] == course.id]
    assignment_rows = db.scalars(select(Assignment).where(Assignment.course_id == course.id, Assignment.is_active == True).order_by(Assignment.created_at.desc())).all()
    submissions_by_assignment = {}
    if current_user.role == "student":
        submissions = db.scalars(select(Submission).join(Assignment, Submission.assignment_id == Assignment.id).where(Assignment.course_id == course.id, Submission.student_id == current_user.id)).all()
        submissions_by_assignment = {item.assignment_id: item for item in submissions}
    assignments = []
    for item in assignment_rows:
        submission = submissions_by_assignment.get(item.id)
        assignments.append({
            "id": item.id,
            "courseId": course.id,
            "title": item.title,
            "instructions": item.instructions,
            "points": item.points,
            "dueAt": item.due_at.isoformat() if item.due_at else None,
            "createdAt": item.created_at.isoformat() if item.created_at else "",
            "submission": {"status": submission.status, "responseText": submission.response_text or "", "score": submission.score, "feedback": submission.feedback or ""} if submission else None,
        })
    quiz_rows = db.scalars(select(Quiz).where(Quiz.course_id == course.id, Quiz.is_published == True).order_by(Quiz.created_at.desc())).all()
    attempts_by_quiz = {}
    if current_user.role == "student":
        attempts = db.scalars(select(QuizAttempt).join(Quiz, QuizAttempt.quiz_id == Quiz.id).where(Quiz.course_id == course.id, QuizAttempt.student_id == current_user.id).order_by(QuizAttempt.submitted_at.desc())).all()
        for attempt in attempts:
            attempts_by_quiz.setdefault(attempt.quiz_id, attempt)
    quizzes = []
    for quiz in quiz_rows:
        questions = db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.id.asc())).all()
        attempt = attempts_by_quiz.get(quiz.id)
        quizzes.append({
            "id": quiz.id,
            "courseId": course.id,
            "title": quiz.title,
            "instructions": quiz.instructions,
            "createdAt": quiz.created_at.isoformat() if quiz.created_at else "",
            "attempt": {"id": attempt.id, "score": attempt.score, "submittedAt": attempt.submitted_at.isoformat() if attempt.submitted_at else ""} if attempt else None,
            "questions": [{"id": question.id, "questionText": question.question_text, "choicesJson": question.choices_json or "", "points": question.points} for question in questions],
        })
    return {"course": serialize_course(course), "modules": modules, "assignments": assignments, "quizzes": quizzes}


@classes_router.get("/classes/{course_id}/people")
def class_people(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    rows = db.execute(select(User, Enrollment).join(Enrollment, Enrollment.student_id == User.id).where(Enrollment.course_id == course.id, Enrollment.status == "active").order_by(User.full_name.asc())).all()
    return {"teacher": serialize_user(course.teacher) if course.teacher else None, "students": [{**serialize_user(student), "enrollmentStatus": enrollment.status} for student, enrollment in rows]}


@classes_router.get("/classes/{course_id}/grades")
def class_grades(course_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    course = get_user_class(db, current_user, course_id)
    if current_user.role == "student":
        grades = db.scalars(select(GradeEntry).where(GradeEntry.course_id == course.id, GradeEntry.student_id == current_user.id).order_by(GradeEntry.created_at.asc())).all()
        return {"course": serialize_course(course), "entries": [{"id": grade.id, "quarter": grade.quarter, "component": grade.component, "score": grade.score, "maxScore": grade.max_score, "weight": grade.weight, "remarks": grade.remarks or ""} for grade in grades], "grades": summarize_grade_entries(course, grades)}
    grades = db.execute(select(GradeEntry, User).join(User, GradeEntry.student_id == User.id).where(GradeEntry.course_id == course.id).order_by(User.full_name.asc(), GradeEntry.created_at.asc())).all()
    by_student: dict[int, list[GradeEntry]] = {}
    names: dict[int, str] = {}
    for grade, student in grades:
        by_student.setdefault(student.id, []).append(grade)
        names[student.id] = student.full_name
    summaries = []
    for student_id, rows in by_student.items():
        for item in summarize_grade_entries(course, rows, names.get(student_id)):
            item["studentId"] = student_id
            summaries.append(item)
    return {"course": serialize_course(course), "entries": [{"id": grade.id, "studentId": student.id, "studentName": student.full_name, "quarter": grade.quarter, "component": grade.component, "score": grade.score, "maxScore": grade.max_score, "weight": grade.weight, "remarks": grade.remarks or ""} for grade, student in grades], "grades": summaries}


@admin_router.get("/admin/enrollments")
def admin_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    rows = db.execute(select(Enrollment, Course, User).join(Course, Enrollment.course_id == Course.id).join(User, Enrollment.student_id == User.id).order_by(Course.code.asc(), User.full_name.asc())).all()
    return [{"id": enrollment.id, "courseId": course.id, "courseCode": course.code, "courseTitle": course.title, "studentId": student.id, "studentName": student.full_name, "studentUsername": student.username, "status": enrollment.status} for enrollment, course, student in rows]


@admin_router.get("/admin/assignments")
def admin_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    rows = db.execute(select(Assignment, Course).join(Course, Assignment.course_id == Course.id).order_by(Assignment.created_at.desc())).all()
    return [{"id": assignment.id, "courseId": course.id, "courseCode": course.code, "courseTitle": course.title, "title": assignment.title, "points": assignment.points, "isActive": assignment.is_active} for assignment, course in rows]


@router.get("/content/{module_id}/pdf")
def content_pdf(module_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson module not found")
    if current_user.role == "teacher":
        ensure_teacher_course(db, current_user, module.course_id)
    if current_user.role == "student":
        ensure_student_enrolled(db, current_user, module.course_id)

    lines = [
        f"MELC: {module.melc_code}",
        f"Learning Competency: {module.learning_competency or 'Not specified'}",
        f"Lesson Objectives: {module.lesson_objectives or 'Not specified'}",
        f"Assessment Type: {module.assessment_type or 'Not specified'}",
        f"Folder: {module.folder_name}",
        f"Week {module.week} | Quarter {module.quarter}",
        f"Summary: {module.summary}",
        f"Guide Question: {module.essential_question}",
        "Prepared for offline classroom delivery through Project DANILO.",
    ]
    pdf_bytes = build_pdf_document(module.title, lines)
    headers = {"Content-Disposition": f'inline; filename="{module.title.lower().replace(" ", "-")}.pdf"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


def _get_or_create_chat_session(db: Session, user_id: int, session_id: int | None, question: str) -> "ChatSession":
    if session_id:
        session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id))
        if session:
            return session
    title = question[:60].strip() or "New Conversation"
    session = ChatSession(user_id=user_id, title=title, is_active=True)
    db.add(session)
    db.flush()
    return session


def _save_chat_messages(db: Session, session_id: int, question: str, answer: str, module_id: int | None, response_mode: str) -> None:
    db.add(ChatMessage(session_id=session_id, role="user", content=question, module_id=module_id, response_mode=response_mode))
    db.add(ChatMessage(session_id=session_id, role="assistant", content=answer, module_id=module_id, response_mode=response_mode))
    db.execute(text("UPDATE chat_sessions SET updated_at = NOW() WHERE id = :sid"), {"sid": session_id})


def _check_ai_rate_limit(user_id: int) -> None:
    """Raise 429 if the user sent an AI request too recently."""
    last = _AI_USER_LAST_REQUEST.get(user_id, 0.0)
    elapsed = time.monotonic() - last
    if elapsed < _AI_COOLDOWN_SECONDS:
        wait = round(_AI_COOLDOWN_SECONDS - elapsed, 1)
        raise HTTPException(status_code=429, detail=f"Please wait {wait}s before sending another question.")
    _AI_USER_LAST_REQUEST[user_id] = time.monotonic()


@ai_router.post("/ai/tutor")
async def tutor(
    payload: TutorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    _check_ai_rate_limit(current_user.id)
    if check_safety(payload.question):
        save_ai_conversation(db, user_id=current_user.id, course_id=None, module_id=None, question=payload.question, answer=SAFETY_REDIRECT)
        return {"answer": SAFETY_REDIRECT, "mode": "normal", "metrics": {}, "context": {"moduleTitle": None, "courseTitle": None, "gradeSignals": []}, "safety_filtered": True, "sessionId": None}

    prompt, module, course, grade_lines, mode = build_tutor_prompt(db, current_user, payload)
    memory = build_rolling_memory(db, current_user.id, course.id if course else None, ROLLING_MEMORY_LIMIT)

    try:
        answer, metrics = await ask_ollama(prompt, mode, memory=memory)
    except httpx.TimeoutException:
        logger.warning("Ollama timed out while answering tutor request for user_id=%s", current_user.id)
        metrics = {"model": OLLAMA_MODEL, "mode": mode, "prompt_tokens": estimate_prompt_tokens(prompt)}
        answer = (
            "DANILO is taking longer than expected on this device. "
            "Please try a shorter question, or ask again in a moment."
        )
    except Exception:
        logger.exception("Ollama failed while answering tutor request for user_id=%s", current_user.id)
        metrics = {"model": OLLAMA_MODEL, "mode": mode, "prompt_tokens": estimate_prompt_tokens(prompt)}
        answer = (
            "DANILO Tutor is offline or still getting ready. Please check the local Ollama service, then try again."
        )

    save_ai_conversation(
        db,
        user_id=current_user.id,
        course_id=course.id if course else None,
        module_id=module.id if module else None,
        question=payload.question,
        answer=answer,
    )
    chat_session = _get_or_create_chat_session(db, current_user.id, payload.session_id, payload.question)
    _save_chat_messages(db, chat_session.id, payload.question, answer, module.id if module else None, mode)
    db.commit()

    return {
        "answer": answer,
        "mode": mode,
        "metrics": metrics,
        "sessionId": chat_session.id,
        "context": {
            "moduleTitle": module.title if module else None,
            "courseTitle": course.title if course else None,
            "gradeSignals": grade_lines,
        },
    }


@ai_router.post("/ai/tutor/stream")
async def tutor_stream(
    payload: TutorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_ai_rate_limit(current_user.id)
    if check_safety(payload.question):
        save_ai_conversation(db, user_id=current_user.id, course_id=None, module_id=None, question=payload.question, answer=SAFETY_REDIRECT)
        async def safe_redirect():
            yield f"data: {json.dumps({'content': SAFETY_REDIRECT})}\n\n"
            yield "event: done\ndata: {}\n\n"
        return StreamingResponse(safe_redirect(), media_type="text/event-stream")

    prompt, module, course, _, mode = build_tutor_prompt(db, current_user, payload)
    memory = build_rolling_memory(db, current_user.id, course.id if course else None, ROLLING_MEMORY_LIMIT)
    user_id = current_user.id
    course_id = course.id if course else None
    module_id = module.id if module else None
    question = payload.question
    chat_session = _get_or_create_chat_session(db, current_user.id, payload.session_id, question)
    session_id = chat_session.id
    db.commit()

    async def event_stream():
        answer_parts: list[str] = []
        try:
            async for item in stream_ollama(prompt, mode, memory=memory):
                if item.get("done"):
                    answer = "".join(answer_parts).strip()
                    if answer:
                        stream_db = SessionLocal()
                        try:
                            save_ai_conversation(
                                stream_db,
                                user_id=user_id,
                                course_id=course_id,
                                module_id=module_id,
                                question=question,
                                answer=answer,
                            )
                            _save_chat_messages(stream_db, session_id, question, answer, module_id, mode)
                            stream_db.commit()
                        finally:
                            stream_db.close()
                    yield f"event: done\ndata: {json.dumps({**item.get('metrics', {}), 'sessionId': session_id})}\n\n"
                else:
                    chunk = item.get("content", "")
                    answer_parts.append(chunk)
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
        except httpx.TimeoutException:
            logger.warning("Ollama stream timed out while answering tutor request for user_id=%s", user_id)
            yield "event: error\ndata: {\"detail\":\"DANILO is taking longer than expected. Try Short mode or ask again.\"}\n\n"
        except Exception:
            logger.exception("Ollama stream failed while answering tutor request for user_id=%s", user_id)
            yield "event: error\ndata: {\"detail\":\"DANILO Tutor is offline or still getting ready. Check local Ollama, then try again.\"}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@admin_router.get("/admin/departments")
def admin_list_departments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    require_role(current_user, "admin")
    rows = db.scalars(select(Department).order_by(Department.name.asc())).all()
    return [{"id": d.id, "name": d.name, "code": d.code, "description": d.description, "headId": d.head_id, "isActive": d.is_active} for d in rows]


@admin_router.post("/admin/departments")
def admin_create_department(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    name = clean_text(payload.get("name"), max_length=120)
    code = clean_text(payload.get("code"), max_length=20).upper()
    if db.scalar(select(Department).where(func.lower(Department.code) == code.lower())):
        raise HTTPException(status_code=409, detail="Department code already exists")
    head_id = parse_int(payload.get("headId") or payload.get("head_id"), "Department head", required=False, minimum=1)
    if head_id and not db.scalar(select(User).where(User.id == head_id, User.role == "teacher")):
        raise HTTPException(status_code=400, detail="Department head must be a teacher account")
    dept = Department(name=name, code=code, description=clean_text(payload.get("description"), required=False, max_length=500), head_id=head_id, is_active=True)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"ok": True, "id": dept.id, "name": dept.name, "code": dept.code}


@admin_router.put("/admin/departments/{dept_id}")
def admin_update_department(dept_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for attr, key, limit in [("name", "name", 120), ("code", "code", 20), ("description", "description", 500)]:
        if key in payload:
            val = clean_text(payload.get(key), required=attr not in {"description"}, max_length=limit)
            setattr(dept, attr, val.upper() if attr == "code" else val)
    if "headId" in payload:
        head_id = parse_int(payload.get("headId"), "Department head", required=False, minimum=1)
        if head_id and not db.scalar(select(User).where(User.id == head_id, User.role == "teacher")):
            raise HTTPException(status_code=400, detail="Department head must be a teacher account")
        dept.head_id = head_id
    if "isActive" in payload:
        dept.is_active = parse_bool(payload["isActive"], "Active status")
    db.commit()
    return {"ok": True}


@admin_router.delete("/admin/departments/{dept_id}")
def admin_delete_department(dept_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    dept.is_active = False
    db.commit()
    return {"ok": True}


@admin_router.post("/admin/courses/{course_id}/enroll-section")
def admin_enroll_section(course_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    course = db.get(Course, course_id)
    if not course or not course.is_active:
        raise HTTPException(status_code=404, detail="Course not found")
    section_id = payload.get("sectionId")
    section_name = payload.get("sectionName")
    if section_id:
        section = db.get(Section, parse_int(section_id, "Section", minimum=1))
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        learners = db.scalars(select(User).where(func.lower(User.section_name) == section.name.lower(), User.role == "student", User.is_active == True)).all()
    elif section_name:
        learners = db.scalars(select(User).where(func.lower(User.section_name) == section_name.lower(), User.role == "student", User.is_active == True)).all()
    else:
        raise HTTPException(status_code=400, detail="sectionId or sectionName is required")
    enrolled = 0
    skipped = 0
    for learner in learners:
        existing = db.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == learner.id))
        if existing:
            if existing.status != "active":
                existing.status = "active"
                enrolled += 1
            else:
                skipped += 1
        else:
            db.add(Enrollment(course_id=course_id, student_id=learner.id, status="active"))
            enrolled += 1
    log_action(db, current_user, "enroll_section", "course", course_id, f"enrolled={enrolled} skipped={skipped}")
    db.commit()
    return {"ok": True, "enrolled": enrolled, "skipped": skipped, "total": len(learners)}


@admin_router.get("/admin/system")
def admin_system_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    require_role(current_user, "admin")
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"
    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=4.0)
        ollama_status = "online" if r.status_code == 200 else "degraded"
        ollama_models = [m.get("name") for m in (r.json().get("models") or [])]
    except Exception:
        ollama_status = "offline"
        ollama_models = []
    uptime_seconds: float | None = None
    if _psutil:
        try:
            cpu_pct = _psutil.cpu_percent(interval=0.3)
            vm = _psutil.virtual_memory()
            ram_total_mb = round(vm.total / 1024 / 1024)
            ram_used_mb = round(vm.used / 1024 / 1024)
            ram_pct = vm.percent
            disk = _psutil.disk_usage("/")
            disk_total_gb = round(disk.total / 1024 / 1024 / 1024, 1)
            disk_used_gb = round(disk.used / 1024 / 1024 / 1024, 1)
            disk_pct = disk.percent
            uptime_seconds = round(time.time() - _psutil.boot_time(), 0)
        except Exception:
            cpu_pct = ram_pct = disk_pct = None
            ram_total_mb = ram_used_mb = disk_total_gb = disk_used_gb = None
    else:
        cpu_pct = ram_pct = disk_pct = None
        ram_total_mb = ram_used_mb = disk_total_gb = disk_used_gb = None

    # Active users = distinct users with JWT activity in the last 15 minutes.
    # We approximate using the AI cooldown dict as a proxy for recent activity.
    active_user_count = len(_AI_USER_LAST_REQUEST)
    return {
        "database": db_status,
        "ollama": ollama_status,
        "ollamaModel": OLLAMA_MODEL,
        "ollamaAvailableModels": ollama_models,
        "portalUrl": f"http://{PORTAL_DOMAIN}",
        "wifiSsid": SSID,
        "mode": "LAN offline-first",
        "uptimeSeconds": uptime_seconds,
        "activeAiUsers": active_user_count,
        "aiQueueSlots": _AI_MAX_CONCURRENT,
        "aiCacheSize": len(_ai_response_cache),
        "hardware": {
            "cpuPercent": cpu_pct,
            "ramPercent": ram_pct,
            "ramUsedMb": ram_used_mb,
            "ramTotalMb": ram_total_mb,
            "diskPercent": disk_pct,
            "diskUsedGb": disk_used_gb,
            "diskTotalGb": disk_total_gb,
        },
        "totals": {
            "learners": db.query(User).filter(User.role == "student").count(),
            "faculty": db.query(User).filter(User.role == "teacher").count(),
            "classes": db.query(Course).filter(Course.is_active == True).count(),
            "sections": db.query(Section).filter(Section.is_active == True).count(),
            "departments": db.query(Department).filter(Department.is_active == True).count(),
            "enrollments": db.query(Enrollment).filter(Enrollment.status == "active").count(),
            "modules": db.query(Module).count(),
            "chatSessions": db.query(ChatSession).count(),
            "chatMessages": db.query(ChatMessage).count(),
        },
    }


@ai_router.get("/ai/sessions")
def list_chat_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    sessions = db.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id, ChatSession.is_active == True)
        .order_by(ChatSession.updated_at.desc())
        .limit(50)
    ).all()
    return [{"id": s.id, "title": s.title, "createdAt": s.created_at.isoformat(), "updatedAt": s.updated_at.isoformat(), "messageCount": len(s.messages)} for s in sessions]


@ai_router.post("/ai/sessions")
def create_chat_session(payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    title = clean_text(payload.get("title") or "New Conversation", max_length=255)
    session = ChatSession(user_id=current_user.id, title=title, is_active=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "createdAt": session.created_at.isoformat(), "updatedAt": session.updated_at.isoformat(), "messageCount": 0}


@router.put("/ai/sessions/{session_id}")
def update_chat_session(session_id: int, payload: dict = Body(default={}), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if "title" in payload:
        session.title = clean_text(payload["title"], max_length=255)
    if "isActive" in payload:
        session.is_active = parse_bool(payload["isActive"], "Active status")
    db.commit()
    return {"ok": True}


@router.delete("/ai/sessions/{session_id}")
def delete_chat_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    db.commit()
    return {"ok": True}


@ai_router.get("/ai/sessions/{session_id}/messages")
def get_session_messages(session_id: int, offset: int = 0, limit: int = 60, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    total = db.scalar(select(func.count()).where(ChatMessage.session_id == session_id))
    messages = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(offset)
        .limit(limit)
    ).all()
    return {
        "sessionId": session_id,
        "title": session.title,
        "total": total,
        "messages": [{"id": m.id, "role": m.role, "content": m.content, "moduleId": m.module_id, "responseMode": m.response_mode, "createdAt": m.created_at.isoformat()} for m in messages],
    }


app.include_router(router)
app.include_router(admin_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(ai_router)
app.include_router(classes_router)
EOF
}

validate_backend_files() {
  local compiler="python3"

  validate_generated_file "${APP_ROOT}/backend/requirements.txt" "backend requirements file"
  validate_generated_file "${APP_ROOT}/backend/Dockerfile" "backend Dockerfile"
  validate_generated_file "${APP_ROOT}/backend/alembic.ini" "Alembic config"
  validate_generated_file "${APP_ROOT}/backend/alembic/env.py" "Alembic env"
  validate_generated_file "${APP_ROOT}/backend/alembic/versions/0001_initial_schema.py" "Alembic initial migration"
  validate_generated_file "${APP_ROOT}/backend/app/__init__.py" "backend package marker"
  validate_generated_file "${APP_ROOT}/backend/app/main.py" "backend main API file"
  validate_generated_file "${APP_ROOT}/backend/app/database.py" "backend database file"
  validate_generated_file "${APP_ROOT}/backend/app/models.py" "backend models file"
  validate_generated_file "${APP_ROOT}/backend/app/security.py" "backend security file"
  validate_generated_file "${APP_ROOT}/backend/app/schemas.py" "backend schemas file"
  validate_generated_file "${APP_ROOT}/backend/app/seed.py" "backend seed file"

  if ! command -v "${compiler}" >/dev/null 2>&1 && command -v python3.12 >/dev/null 2>&1; then
    compiler="python3.12"
  fi

  if command -v "${compiler}" >/dev/null 2>&1; then
    run_step_command "Compiling generated backend Python files" "${compiler}" -m py_compile \
      "${APP_ROOT}/backend/app/__init__.py" \
      "${APP_ROOT}/backend/app/database.py" \
      "${APP_ROOT}/backend/app/models.py" \
      "${APP_ROOT}/backend/app/security.py" \
      "${APP_ROOT}/backend/app/schemas.py" \
      "${APP_ROOT}/backend/app/seed.py" \
      "${APP_ROOT}/backend/app/main.py"
  else
    skip "Python compiler not available yet; skipping backend syntax validation"
  fi
}
