import json
import os
import random
from datetime import datetime, timezone
from sqlalchemy import func, select, delete
from sqlalchemy.orm import Session

from .models import (
    User, Course, Module, StreamPost, Enrollment, GradeEntry, Assignment, 
    AssignmentQuestion, Submission, Section, Quiz, QuizQuestion, QuizAttempt, 
    AIConversation, StudentAIProfile, ChatSession, ChatMessage, Department
)
from app.core.security import hash_password, verify_password

def clean_seed_text(value: str | None) -> str | None:
    if value is None: return None
    cleaned = "".join(ch for ch in value.replace("\r", " ").replace("\n", " ") if ord(ch) < 128)
    return " ".join(cleaned.split()) or None

def get_or_create_user(session, *, role, username, email, full_name, password, grade_level=None, education_level=None, section_name=None, department_id=None):
    user = session.scalar(select(User).where(func.lower(User.username) == username.lower()))
    if user: 
        return user
    user = User(
        role=role, 
        username=clean_seed_text(username), 
        email=clean_seed_text(email), 
        full_name=clean_seed_text(full_name), 
        grade_level=clean_seed_text(grade_level), 
        education_level=education_level, 
        section_name=clean_seed_text(section_name),
        department_id=department_id,
        password_salt="", 
        password_hash=hash_password(clean_seed_text(password)), 
        is_active=True,
        force_password_change=True if role in ["student", "teacher"] else False
    )
    session.add(user)
    session.flush()
    return user

def get_or_create_department(session, *, name, code):
    dept = session.scalar(select(Department).where(func.lower(Department.name) == name.lower()))
    if dept: return dept
    dept = Department(name=name, code=code, description=f"{name} Department")
    session.add(dept)
    session.flush()
    return dept

def get_or_create_section(session, *, name, grade_level, education_level, strand=None, school_year="2026-2027"):
    section = session.scalar(select(Section).where(
        func.lower(Section.name) == name.lower(),
        Section.school_year == school_year
    ))
    if section: return section
    section = Section(name=name, grade_level=grade_level, education_level=education_level, strand=strand, school_year=school_year, is_active=True)
    session.add(section)
    session.flush()
    return section

def get_or_create_course(session, *, code, title, subject, education_level, grade_level, strand, term, school_year, teacher_id, department_id=None):
    course = session.scalar(select(Course).where(func.lower(Course.code) == code.lower()))
    if course: return course
    course = Course(
        code=code, title=title, subject=subject, education_level=education_level, 
        grade_level=grade_level, strand=strand, term=term, school_year=school_year, 
        description=f"{title} ({term}, {school_year})", teacher_id=teacher_id, department_id=department_id,
        is_active=True
    )
    session.add(course)
    session.flush()
    return course

def get_or_create_enrollment(session, *, course_id, student_id):
    enrollment = session.scalar(select(Enrollment).where(Enrollment.course_id == course_id, Enrollment.student_id == student_id))
    if enrollment: return enrollment
    enrollment = Enrollment(course_id=course_id, student_id=student_id, status="active")
    session.add(enrollment)
    session.flush()
    return enrollment

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
    session.execute(delete(ChatMessage))
    session.execute(delete(ChatSession))
    session.execute(delete(AIConversation))
    session.execute(delete(StudentAIProfile))
    
    users_to_keep = session.scalars(select(User).where(User.role == 'admin')).all()
    keep_ids = [u.id for u in users_to_keep]
    session.execute(delete(User).where(User.id.notin_(keep_ids)))
    session.execute(delete(Department))
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

    if os.getenv("DANILO_RESET_DEMO_DATA", "0").strip().lower() in {"1", "true", "yes"}:
        wipe_old_mock_data(session)

    clean_username = clean_seed_text(admin_username) or "admin"
    clean_password = clean_seed_text(admin_password)
    clean_portal_domain = clean_seed_text(portal_domain) or "local"

    ensure_admin_user(session, admin_username=clean_username, admin_password=clean_password, portal_domain=clean_portal_domain)

    # 1. Create SHS Departments
    depts = {
        "Math": get_or_create_department(session, name="Mathematics", code="MATH"),
        "Science": get_or_create_department(session, name="Science", code="SCI"),
        "English": get_or_create_department(session, name="English", code="ENG"),
        "Social": get_or_create_department(session, name="Social Sciences", code="SOC"),
        "Research": get_or_create_department(session, name="Research", code="RES")
    }

    # 2. Create SHS STEM Teachers
    teacher_names = [
        ("Maria Lourdes Santiago", "Math", "teacher.math1"),
        ("Jose Antonio Reyes", "Science", "teacher.sci1"),
        ("Grace Villanueva", "English", "teacher.eng1"),
        ("Roberto Mendoza", "Social", "teacher.soc1"),
        ("Ana Marie Cruz", "Math", "teacher.math2"),
        ("Emmanuel Bautista", "Science", "teacher.sci2"),
        ("Liza Navarro", "Research", "teacher.res1")
    ]
    
    teachers = {}
    for full_name, dept_key, uname in teacher_names:
        teachers[uname] = get_or_create_user(
            session, role="teacher", username=uname, email=f"{uname}@{clean_portal_domain}", 
            full_name=full_name, password="teacher123", department_id=depts[dept_key].id
        )

    # 3. Create SHS Sections
    section_data = [
        ("Grade 11 STEM A", "Grade 11", "Senior High School", "STEM"),
        ("Grade 11 STEM B", "Grade 11", "Senior High School", "STEM"),
        ("Grade 11 STEM C", "Grade 11", "Senior High School", "STEM"),
        ("Grade 12 STEM A", "Grade 12", "Senior High School", "STEM"),
        ("Grade 12 STEM B", "Grade 12", "Senior High School", "STEM"),
        ("Grade 12 STEM C", "Grade 12", "Senior High School", "STEM")
    ]
    
    sections = {}
    for s_name, g_level, e_level, strand in section_data:
        sections[s_name] = get_or_create_section(session, name=s_name, grade_level=g_level, education_level=e_level, strand=strand)

    # 4. Create Students (Realistic Philippine Names)
    student_first_names_m = ["Miguel", "Nathaniel", "Joshua", "Gabriel", "Carlo", "Rafael", "Daniel", "Christian", "Angelo", "Francis", "Jerome", "Vince", "Aaron", "Juan", "Jose"]
    student_first_names_f = ["Althea", "Sofia", "Andrea", "Jasmine", "Mikaela", "Patricia", "Bianca", "Samantha", "Nicole", "Trisha", "Camille", "Erika", "Kyla", "Maria", "Ana"]
    student_last_names = [
        "Santos", "Reyes", "Cruz", "Dela Peña", "Garcia", "Mendoza", "Villanueva", "Navarro",
        "Bautista", "Ramos", "Aquino", "Soriano", "Mercado", "Tolentino", "Javier", "Lim",
        "Flores", "Castillo", "Del Rosario", "Gonzales", "Tolentino", "Domingo", "Pascual"
    ]
    
    students = []
    # 20 students per section
    student_idx = 1
    for s_name, s_obj in sections.items():
        for _ in range(10): # 10 males
            fname = f"{random.choice(student_first_names_m)} {random.choice(student_last_names)}"
            uname = f"student{student_idx:03d}"
            st = get_or_create_user(session, role="student", username=uname, email=f"{uname}@student.{clean_portal_domain}", full_name=fname, password="student123", grade_level=s_obj.grade_level, education_level=s_obj.education_level, section_name=s_obj.name)
            students.append((st, s_obj))
            student_idx += 1
        for _ in range(10): # 10 females
            fname = f"{random.choice(student_first_names_f)} {random.choice(student_last_names)}"
            uname = f"student{student_idx:03d}"
            st = get_or_create_user(session, role="student", username=uname, email=f"{uname}@student.{clean_portal_domain}", full_name=fname, password="student123", grade_level=s_obj.grade_level, education_level=s_obj.education_level, section_name=s_obj.name)
            students.append((st, s_obj))
            student_idx += 1

    # 5. Define SHS Subjects
    g11_subjects = [
        ("General Mathematics", "Mathematics", "teacher.math1", "Math"),
        ("Earth and Life Science", "Science", "teacher.sci1", "Science"),
        ("Physical Science", "Science", "teacher.sci2", "Science"),
        ("Oral Communication", "English", "teacher.eng1", "English"),
        ("Reading and Writing", "English", "teacher.eng1", "English"),
        ("Personal Development", "Social Sciences", "teacher.soc1", "Social"),
        ("Understanding Culture, Society and Politics", "Social Sciences", "teacher.soc1", "Social")
    ]
    
    g12_subjects = [
        ("Pre-Calculus", "Mathematics", "teacher.math2", "Math"),
        ("Basic Calculus", "Mathematics", "teacher.math2", "Math"),
        ("General Biology", "Science", "teacher.sci1", "Science"),
        ("General Chemistry", "Science", "teacher.sci2", "Science"),
        ("General Physics", "Science", "teacher.sci2", "Science"),
        ("Research Project", "Research", "teacher.res1", "Research"),
        ("English for Academic and Professional Purposes", "English", "teacher.eng1", "English")
    ]

    courses = []
    # Create Courses for all 3 Terms
    for term in ["Term 1", "Term 2", "Term 3"]:
        term_id = term.replace(" ", "")
        for s_name, s_obj in sections.items():
            subjects = g11_subjects if s_obj.grade_level == "Grade 11" else g12_subjects
            for subj_title, subj_category, t_uname, dept_key in subjects:
                code_prefix = "".join([word[0] for word in subj_title.split() if word.isalnum()])
                code = f"{s_obj.grade_level[-2:]}{s_name[-1]}-{code_prefix}-{term_id}"
                
                course_obj = get_or_create_course(
                    session, code=code, title=subj_title, subject=subj_category, 
                    education_level="Senior High School", grade_level=s_obj.grade_level, 
                    strand="STEM", term=term, school_year="2026-2027", 
                    teacher_id=teachers[t_uname].id, department_id=depts[dept_key].id
                )
                courses.append((course_obj, s_name))

    # Enroll students
    for st, section_obj in students:
        for course_obj, course_section in courses:
            if section_obj.name == course_section:
                get_or_create_enrollment(session, course_id=course_obj.id, student_id=st.id)

    # 6. Create Modules
    for course_obj, _ in courses[:20]: # Add modules to first 20 courses to save time
        exists = session.scalar(select(Module).where(Module.course_id == course_obj.id))
        if not exists:
            mod1 = Module(
                course_id=course_obj.id, melc_code="MELC-1", learning_competency="Understand core concepts",
                assessment_type="Written Work", grade_level=course_obj.grade_level,
                subject=course_obj.subject, term=course_obj.term, week=1, sequence_order=1,
                folder_name="Introduction", title=f"Intro to {course_obj.title}",
                summary="Introduction module.", essential_question="Why is this important?", content="# Content"
            )
            session.add(mod1)

    session.flush()

    # 7. Generate Grades (Midterm & Endterm for Term 1, Term 2, Term 3)
    # We will generate different performance profiles for students
    student_profiles = {}
    for st, _ in students:
        rand = random.random()
        if rand < 0.2:
            base = 92 # High
        elif rand < 0.8:
            base = 82 # Average
        else:
            base = 74 # At-risk
        student_profiles[st.id] = base

    grade_components = [
        ("Written Works 1", 100, 0.2),
        ("Written Works 2", 100, 0.2),
        ("Performance Task 1", 100, 0.4),
        ("Quarterly Assessment", 100, 0.2)
    ]

    for course_obj, course_section in courses:
        enrolled_students = [st for st, s_obj in students if s_obj.name == course_section]
        
        for st in enrolled_students:
            profile_base = student_profiles[st.id]
            
            for grading_period in ["Midterm", "Endterm"]:
                for comp_name, max_score, weight in grade_components:
                    exists_g = session.scalar(select(GradeEntry).where(GradeEntry.student_id == st.id, GradeEntry.course_id == course_obj.id, GradeEntry.grading_period == grading_period, GradeEntry.component == comp_name))
                    if not exists_g:
                        # Introduce slight variation
                        variation = random.uniform(-4, 5)
                        score = min(100, max(65, profile_base + variation))
                        session.add(GradeEntry(
                            student_id=st.id, course_id=course_obj.id, term=course_obj.term, 
                            grading_period=grading_period, component=comp_name, score=score, 
                            max_score=max_score, weight=weight, recorded_by=course_obj.teacher_id, 
                            remarks=""
                        ))

    session.flush()

    # 8. AI / Tutor Demo Data
    first_student = students[0][0]
    first_course = courses[0][0]
    
    exists_ai = session.scalar(select(AIConversation).where(AIConversation.student_id == first_student.id))
    if not exists_ai:
        session.add(AIConversation(student_id=first_student.id, course_id=first_course.id, prompt="Can you explain limits?", response="Limits describe how a function behaves near a point..."))
        
        prof = StudentAIProfile(
            student_id=first_student.id,
            strengths_json='[{"topic": "Basic Algebra", "average": 90, "evidenceCount": 4}]',
            weak_concepts_json='[{"topic": "Derivatives", "average": 70, "evidenceCount": 2}]',
            recommendations_json='["Review limit definition of a derivative."]',
            ai_interaction_count=1
        )
        session.add(prof)

    session.commit()
