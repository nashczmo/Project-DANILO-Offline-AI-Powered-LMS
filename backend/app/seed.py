import json
import os
from datetime import datetime, timezone
from sqlalchemy import func, select, delete
from sqlalchemy.orm import Session

from .models import User, Course, Module, StreamPost, Enrollment, GradeEntry, Assignment, AssignmentQuestion, Submission, Section, Quiz, QuizQuestion, QuizAttempt, AIConversation, StudentAIProfile
from app.core.security import hash_password, verify_password

def clean_seed_text(value: str | None) -> str | None:
    if value is None: return None
    cleaned = "".join(ch for ch in value.replace("\r", " ").replace("\n", " ") if ord(ch) < 128)
    return " ".join(cleaned.split()) or None

def get_or_create_user(session, *, role, username, email, full_name, password, grade_level=None, education_level=None, section_name=None):
    user = session.scalar(select(User).where(func.lower(User.username) == username.lower()))
    if user: return user
    user = User(role=role, username=clean_seed_text(username), email=clean_seed_text(email), full_name=clean_seed_text(full_name), grade_level=clean_seed_text(grade_level), education_level=education_level, section_name=clean_seed_text(section_name), password_salt="", password_hash=hash_password(clean_seed_text(password)), is_active=True)
    session.add(user)
    session.flush()
    return user

def reset_password(user: User, password: str) -> None:
    user.password_salt = ""
    user.password_hash = hash_password(clean_seed_text(password) or "")

def wipe_old_mock_data(session: Session):
    session.execute(delete(Submission))
    session.execute(delete(QuizAttempt))
    session.execute(delete(AssignmentQuestion))
    session.execute(delete(QuizQuestion))
    session.execute(delete(Assignment))
    session.execute(delete(Quiz))
    session.execute(delete(GradeEntry))
    session.execute(delete(StreamPost))
    session.execute(delete(Enrollment))
    session.execute(delete(Module))
    session.execute(delete(Course))
    session.execute(delete(Section))
    session.execute(delete(AIConversation))
    session.execute(delete(StudentAIProfile))
    
    users_to_keep = session.scalars(select(User).where(User.role == 'admin')).all()
    keep_ids = [u.id for u in users_to_keep]
    session.execute(delete(User).where(User.id.notin_(keep_ids)))
    session.commit()

def ensure_admin_user(session: Session, *, admin_username: str, admin_password: str, portal_domain: str) -> User:
    clean_username = clean_seed_text(admin_username) or "admin"
    clean_password = clean_seed_text(admin_password)
    clean_portal_domain = clean_seed_text(portal_domain) or "local"
    admin = session.scalar(select(User).where(func.lower(User.username) == clean_username.lower()))
    if admin:
        if clean_password and not verify_password(clean_password, admin.password_hash):
            reset_password(admin, clean_password)
        if admin.role != "admin":
            admin.role = "admin"
        admin.is_active = True
    else:
        admin = get_or_create_user(session, role="admin", username=clean_username, email=f"admin@{clean_portal_domain}", full_name="Danilo Network Administrator", password=clean_password)
    session.commit()
    return admin

def seed_defaults(session: Session, *, admin_username: str, admin_password: str, portal_domain: str) -> None:
    if os.getenv("DANILO_SEED_DEMO", "0").strip().lower() not in {"1", "true", "yes"}:
        ensure_admin_user(session, admin_username=admin_username, admin_password=admin_password, portal_domain=portal_domain)
        return

    wipe_old_mock_data(session)

    clean_username = clean_seed_text(admin_username) or "admin"
    clean_password = clean_seed_text(admin_password)
    clean_portal_domain = clean_seed_text(portal_domain) or "local"

    ensure_admin_user(session, admin_username=clean_username, admin_password=clean_password, portal_domain=clean_portal_domain)

    # Create Sections
    sec_11a = Section(name="STEM 11A", grade_level="Grade 11", education_level="Senior High School", strand="STEM", school_year="2026-2027", is_active=True)
    sec_11b = Section(name="STEM 11B", grade_level="Grade 11", education_level="Senior High School", strand="STEM", school_year="2026-2027", is_active=True)
    session.add_all([sec_11a, sec_11b])
    session.flush()

    # Create Teachers
    teachers_data = [
        ("t_precalc", "Prof. Ricardo Dalisay"),
        ("t_gchem", "Dr. Leni Robredo"),
        ("t_stat", "Mr. Rodrigo Duterte"),
        ("t_read", "Ms. Miriam Defensor"),
        ("t_emptech", "Engr. Bongbong Marcos"),
        ("t_lit", "Mrs. Gloria Arroyo"),
        ("t_pe", "Coach Manny Pacquiao")
    ]
    teachers = {}
    for uname, fname in teachers_data:
        teachers[uname] = get_or_create_user(session, role="teacher", username=uname, email=f"{uname}@{clean_portal_domain}", full_name=fname, password=clean_password)

    # Create Subjects
    subjects = [
        {"code": "PRECALC-11", "title": "Pre-Calculus", "subj": "Mathematics", "teacher": teachers["t_precalc"]},
        {"code": "GCHEM-11", "title": "General Chemistry 1", "subj": "Science", "teacher": teachers["t_gchem"]},
        {"code": "STAT-11", "title": "Statistics and Probability", "subj": "Mathematics", "teacher": teachers["t_stat"]},
        {"code": "READ-11", "title": "Reading and Writing Skills", "subj": "English", "teacher": teachers["t_read"]},
        {"code": "EMPTECH-11", "title": "Empowerment Technologies", "subj": "ICT", "teacher": teachers["t_emptech"]},
        {"code": "LIT-11", "title": "21st Century Literature", "subj": "Literature", "teacher": teachers["t_lit"]},
        {"code": "PEH-11", "title": "Physical Education and Health", "subj": "PE", "teacher": teachers["t_pe"]}
    ]
    
    courses = {}
    for s in subjects:
        for term in ["Term 1", "Term 2", "Term 3"]:
            term_suffix = term.replace("Term ", "T")
            c = Course(code=f"{s['code']}-{term_suffix}", title=s["title"], subject=s["subj"], education_level="Senior High School", grade_level="Grade 11", strand="STEM", term=term, school_year="2026-2027", description=f"{s['title']} for Grade 11 STEM", teacher_id=s["teacher"].id, is_active=True)
            session.add(c)
    session.flush()

    # Create Students
    students_11a = [
        ("s_juan", "Juan Dela Cruz"), ("s_maria", "Maria Clara"), ("s_jose", "Jose Rizal"), ("s_andres", "Andres Bonifacio"), ("s_emilio", "Emilio Aguinaldo")
    ]
    students_11b = [
        ("s_apol", "Apolinario Mabini"), ("s_gabriela", "Gabriela Silang"), ("s_melchora", "Melchora Aquino"), ("s_lapu", "Lapu-Lapu"), ("s_diego", "Diego Silang")
    ]
    
    st_objects = []
    for uname, fname in students_11a:
        st_objects.append(get_or_create_user(session, role="student", username=uname, email=f"{uname}@{clean_portal_domain}", full_name=fname, password=clean_password, grade_level="Grade 11", section_name="STEM 11A"))
    for uname, fname in students_11b:
        st_objects.append(get_or_create_user(session, role="student", username=uname, email=f"{uname}@{clean_portal_domain}", full_name=fname, password=clean_password, grade_level="Grade 11", section_name="STEM 11B"))

    # Enroll Students in all courses
    all_courses = session.scalars(select(Course)).all()
    for st in st_objects:
        for c in all_courses:
            session.add(Enrollment(course_id=c.id, student_id=st.id))
    session.flush()

    # Create polynomial functions quiz for Pre-Calculus
    precalc_course = session.scalar(select(Course).where(Course.code == "PRECALC-11-T1", Course.term == "Term 1"))
    quiz = Quiz(course_id=precalc_course.id, title="Polynomial Functions Quiz", instructions="Answer the 25 items carefully across 3 parts.", created_by=teachers["t_precalc"].id, is_published=True)
    session.add(quiz)
    session.flush()
    
    for i in range(1, 26):
        part = "Part 1: Roots" if i <= 10 else "Part 2: Graphing" if i <= 20 else "Part 3: Applications"
        qq = QuizQuestion(quiz_id=quiz.id, question_text=f"({part}) Question {i} about Polynomial Functions", choices_json='["A", "B", "C", "D"]', answer_key="A", points=1)
        session.add(qq)
        
    assignment = Assignment(course_id=precalc_course.id, title="Rational Functions Homework", instructions="Solve the problems.", points=100, assignment_type="quiz", attachments_json="[]", created_by=teachers["t_precalc"].id)
    session.add(assignment)
    session.flush()
    session.add(AssignmentQuestion(assignment_id=assignment.id, section_name="Section 1", question_text="Solve x^2 = 4", question_type="multiple_choice", choices_json='["2", "4"]', answer_key="2", points=100))
    
    # Announcements
    session.add(StreamPost(course_id=precalc_course.id, author_id=teachers["t_precalc"].id, title="Quarterly Exam Schedule", body="Our quarterly exams will begin next Monday.", post_type="announcement"))
    session.add(StreamPost(course_id=precalc_course.id, author_id=teachers["t_precalc"].id, title="Class Suspension Notice", body="Due to the typhoon, classes are suspended tomorrow.", post_type="announcement"))
    session.add(StreamPost(course_id=precalc_course.id, author_id=teachers["t_precalc"].id, title="Science Fair Reminder", body="Don't forget to submit your proposals.", post_type="announcement"))
    session.add(StreamPost(course_id=precalc_course.id, author_id=teachers["t_precalc"].id, title="Submission Reminder", body="Submit your homework by Friday.", post_type="announcement"))
    
    # Add dummy grades for all students
    for st in st_objects:
        for c in all_courses:
            if st.username in ["s_jose", "s_diego"]:
                score = 65 if c.term == "Term 1" else 70 if c.term == "Term 2" else 73
            elif st.username in ["s_andres"]:
                score = 75 if c.term == "Term 1" else 82 if c.term == "Term 2" else 78
            else:
                score = 85 if c.term == "Term 1" else 88 if c.term == "Term 2" else 92
                
            session.add(GradeEntry(student_id=st.id, course_id=c.id, term=c.term, component="Written Work (WW)", score=score*0.3, max_score=30, weight=0.3, recorded_by=c.teacher_id))
            session.add(GradeEntry(student_id=st.id, course_id=c.id, term=c.term, component="Performance Tasks (PT)", score=score*0.5, max_score=50, weight=0.5, recorded_by=c.teacher_id))
            session.add(GradeEntry(student_id=st.id, course_id=c.id, term=c.term, component="Quarterly Assessment (QA)", score=score*0.2, max_score=20, weight=0.2, recorded_by=c.teacher_id))
    
    # Add AI Data for the first student
    juan = st_objects[0]
    session.add(AIConversation(student_id=juan.id, course_id=precalc_course.id, prompt="How do I find the roots of a polynomial?", response="You can use the rational root theorem!"))
    profile = StudentAIProfile(student_id=juan.id, strengths_json='[{"topic": "Polynomial Roots", "average": 95, "evidenceCount": 5}]', weak_concepts_json='[{"topic": "Rational Functions", "average": 75, "evidenceCount": 3}]', recommendations_json='["Review Rational Functions with a short practice activity."]')
    session.add(profile)
    
    session.commit()
