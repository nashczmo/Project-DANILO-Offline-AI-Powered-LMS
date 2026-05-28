import uuid
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    role = Column(String(20), nullable=False)
    username = Column(String(120), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=False)
    education_level = Column(String(40), nullable=True)
    grade_level = Column(String(50), nullable=True)
    strand = Column(String(80), nullable=True)
    section_name = Column(String(120), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(120), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    head_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    head = relationship("User", foreign_keys=[head_id])
    members = relationship("User", back_populates="department", foreign_keys="User.department_id")
    courses = relationship("Course", back_populates="department")


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("term IN ('Term 1', 'Term 2', 'Term 3')", name="ck_courses_term"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    code = Column(String(50), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(120), nullable=False)
    education_level = Column(String(40), nullable=False, default="Junior High School")
    grade_level = Column(String(50), nullable=False)
    strand = Column(String(80), nullable=True)
    term = Column(String(10), nullable=False)
    school_year = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")


class Module(Base):
    __tablename__ = "modules"
    __table_args__ = (
        CheckConstraint("term IN ('Term 1', 'Term 2', 'Term 3')", name="ck_modules_term"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    melc_code = Column(String(120), nullable=False)
    learning_competency = Column(Text, nullable=True)
    lesson_objectives = Column(Text, nullable=True)
    assessment_type = Column(String(120), nullable=True)
    grade_level = Column(String(50), nullable=False)
    subject = Column(String(120), nullable=False)
    term = Column(String(10), nullable=False)
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

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    post_type = Column(String(40), nullable=False, default="announcement")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="posts")
    author = relationship("User")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=True)
    points = Column(Float, nullable=False, default=100)
    assignment_type = Column(String(50), nullable=False, default="written_response") # quiz, file_submission, written_response, mixed
    attachments_json = Column(Text, nullable=False, default="[]")
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course")
    creator = relationship("User")
    questions = relationship("AssignmentQuestion", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentQuestion(Base):
    __tablename__ = "assignment_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assignment_id = Column(String(36), ForeignKey("assignments.id"), nullable=False)
    section_name = Column(String(120), nullable=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="multiple_choice") # multiple_choice, checkbox, short_answer, identification, true_false
    choices_json = Column(Text, nullable=True)
    answer_key = Column(Text, nullable=True)
    points = Column(Float, nullable=False, default=1)

    assignment = relationship("Assignment", back_populates="questions")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    assignment_id = Column(String(36), ForeignKey("assignments.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    response_text = Column(Text, nullable=True)
    answers_json = Column(Text, nullable=True)
    attachments_json = Column(Text, nullable=False, default="[]")
    status = Column(String(30), nullable=False, default="submitted")
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    assignment = relationship("Assignment")
    student = relationship("User")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    is_published = Column(Boolean, nullable=False, default=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course")
    creator = relationship("User")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    choices_json = Column(Text, nullable=True)
    answer_key = Column(Text, nullable=True)
    points = Column(Float, nullable=False, default=1)

    quiz = relationship("Quiz")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    answers_json = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    quiz = relationship("Quiz")
    student = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(120), nullable=False)
    entity_type = Column(String(80), nullable=False)
    entity_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    actor = relationship("User")


class GradeEntry(Base):
    __tablename__ = "grade_entries"
    __table_args__ = (
        CheckConstraint("term IN ('Term 1', 'Term 2', 'Term 3')", name="ck_grade_entries_term"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False, index=True)
    term = Column(String(10), nullable=False)
    component = Column(String(80), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    recorded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    course = relationship("Course", back_populates="grades")
    student = relationship("User", foreign_keys=[student_id])
    recorder = relationship("User", foreign_keys=[recorded_by])


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("name", "grade_level", "school_year", name="uq_section_name_grade_year"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(120), nullable=False)
    grade_level = Column(String(50), nullable=False)
    education_level = Column(String(40), nullable=False, default="Junior High School")
    strand = Column(String(80), nullable=True)
    school_year = Column(String(20), nullable=False, default="2026-2027")
    adviser_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    adviser = relationship("User")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=True)
    module_id = Column(String(36), ForeignKey("modules.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("User")
    course = relationship("Course")
    module = relationship("Module", back_populates="conversations")


class StudentAIProfile(Base):
    __tablename__ = "student_ai_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    strengths_json = Column(Text, nullable=False, default="[]")
    weak_concepts_json = Column(Text, nullable=False, default="[]")
    learning_trends_json = Column(Text, nullable=False, default="[]")
    recommendations_json = Column(Text, nullable=False, default="[]")
    quiz_summary_json = Column(Text, nullable=False, default="{}")
    assignment_summary_json = Column(Text, nullable=False, default="{}")
    ai_interaction_count = Column(Integer, nullable=False, default=0)
    last_interaction_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("User")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False, default="New Conversation")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    module_id = Column(String(36), ForeignKey("modules.id"), nullable=True)
    response_mode = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("ChatSession", back_populates="messages")
    module = relationship("Module")
