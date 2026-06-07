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
        description=f"{title} ({school_year})", teacher_id=teacher_id, department_id=department_id,
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

    # 1. Create Departments
    depts = {
        "Math": get_or_create_department(session, name="Mathematics", code="MATH"),
        "Science": get_or_create_department(session, name="Science", code="SCI"),
        "English": get_or_create_department(session, name="English", code="ENG"),
        "Filipino": get_or_create_department(session, name="Filipino", code="FIL"),
        "AP": get_or_create_department(session, name="Araling Panlipunan", code="AP"),
        "SHS": get_or_create_department(session, name="Senior High School", code="SHS"),
        "ICT": get_or_create_department(session, name="ICT & Technology", code="ICT")
    }

    # 2. Create Teachers
    teacher_names = [
        ("Maria Lourdes Santiago", "Math", "teacher.math"),
        ("Jose Antonio Reyes", "Science", "teacher.science"),
        ("Grace Villanueva", "English", "teacher.english"),
        ("Roberto Mendoza", "Filipino", "teacher.filipino"),
        ("Ana Marie Cruz", "AP", "teacher.ap"),
        ("Emmanuel Bautista", "SHS", "teacher.shs1"),
        ("Liza Navarro", "SHS", "teacher.shs2"),
        ("Carlos Enriquez", "ICT", "teacher.ict")
    ]
    
    teachers = {}
    for full_name, dept_key, uname in teacher_names:
        teachers[uname] = get_or_create_user(
            session, role="teacher", username=uname, email=f"{uname}@{clean_portal_domain}", 
            full_name=full_name, password="teacher123", department_id=depts[dept_key].id
        )

    # 3. Create Sections
    section_data = [
        ("Grade 7 - Sampaguita", "Grade 7", "Junior High School", None),
        ("Grade 8 - Mabini", "Grade 8", "Junior High School", None),
        ("Grade 9 - Rizal", "Grade 9", "Junior High School", None),
        ("Grade 10 - Bonifacio", "Grade 10", "Junior High School", None),
        ("Grade 11 STEM - Newton", "Grade 11", "Senior High School", "STEM"),
        ("Grade 11 HUMSS - Luna", "Grade 11", "Senior High School", "HUMSS"),
        ("Grade 12 ABM - Jacinto", "Grade 12", "Senior High School", "ABM"),
        ("Grade 12 GAS - Del Pilar", "Grade 12", "Senior High School", "GAS")
    ]
    
    sections = {}
    for s_name, g_level, e_level, strand in section_data:
        sections[s_name] = get_or_create_section(session, name=s_name, grade_level=g_level, education_level=e_level, strand=strand)

    # 4. Create Students
    student_first_names = [
        "Miguel", "Althea", "Nathaniel", "Sofia", "Joshua", "Andrea", "Gabriel", "Jasmine",
        "Carlo", "Mikaela", "Rafael", "Patricia", "Daniel", "Bianca", "Christian", "Samantha",
        "Angelo", "Nicole", "Francis", "Trisha", "Jerome", "Camille", "Vince", "Erika", "Aaron", "Kyla"
    ]
    student_last_names = [
        "Santos", "Reyes", "Cruz", "Dela Peña", "Garcia", "Mendoza", "Villanueva", "Navarro",
        "Bautista", "Ramos", "Aquino", "Soriano", "Mercado", "Tolentino", "Javier", "Lim",
        "Flores", "Castillo", "Del Rosario", "Gonzales"
    ]
    
    students = []
    # Generate ~48 students (6 per section)
    student_idx = 1
    for s_name, s_obj in sections.items():
        for _ in range(6):
            fname = f"{random.choice(student_first_names)} {random.choice(student_last_names)}"
            uname = f"student{student_idx:03d}"
            st = get_or_create_user(
                session, role="student", username=uname, email=f"{uname}@student.{clean_portal_domain}", 
                full_name=fname, password="student123", grade_level=s_obj.grade_level, 
                education_level=s_obj.education_level, section_name=s_obj.name
            )
            students.append((st, s_obj))
            student_idx += 1

    # 5. Create Courses
    course_data = [
        {"code": "G7-MATH-SAMP", "title": "Grade 7 Mathematics", "subj": "Mathematics", "g_level": "Grade 7", "e_level": "Junior High School", "strand": None, "teacher": "teacher.math", "section": "Grade 7 - Sampaguita", "dept": "Math"},
        {"code": "G8-SCI-MABINI", "title": "Grade 8 Science", "subj": "Science", "g_level": "Grade 8", "e_level": "Junior High School", "strand": None, "teacher": "teacher.science", "section": "Grade 8 - Mabini", "dept": "Science"},
        {"code": "G9-ENG-RIZAL", "title": "Grade 9 English", "subj": "English", "g_level": "Grade 9", "e_level": "Junior High School", "strand": None, "teacher": "teacher.english", "section": "Grade 9 - Rizal", "dept": "English"},
        {"code": "G10-AP-BONI", "title": "Grade 10 Araling Panlipunan", "subj": "Araling Panlipunan", "g_level": "Grade 10", "e_level": "Junior High School", "strand": None, "teacher": "teacher.ap", "section": "Grade 10 - Bonifacio", "dept": "AP"},
        {"code": "G11-STEM-PRECAL", "title": "Pre-Calculus", "subj": "Mathematics", "g_level": "Grade 11", "e_level": "Senior High School", "strand": "STEM", "teacher": "teacher.shs1", "section": "Grade 11 STEM - Newton", "dept": "SHS"},
        {"code": "G11-STEM-GCHEM", "title": "General Chemistry 1", "subj": "Science", "g_level": "Grade 11", "e_level": "Senior High School", "strand": "STEM", "teacher": "teacher.shs2", "section": "Grade 11 STEM - Newton", "dept": "SHS"},
        {"code": "G11-HUMSS-READ", "title": "Reading and Writing Skills", "subj": "English", "g_level": "Grade 11", "e_level": "Senior High School", "strand": "HUMSS", "teacher": "teacher.english", "section": "Grade 11 HUMSS - Luna", "dept": "English"},
        {"code": "G12-ABM-BMATH", "title": "Business Mathematics", "subj": "Mathematics", "g_level": "Grade 12", "e_level": "Senior High School", "strand": "ABM", "teacher": "teacher.shs1", "section": "Grade 12 ABM - Jacinto", "dept": "SHS"},
        {"code": "G12-GAS-RES2", "title": "Practical Research 2", "subj": "Practical Research", "g_level": "Grade 12", "e_level": "Senior High School", "strand": "GAS", "teacher": "teacher.shs2", "section": "Grade 12 GAS - Del Pilar", "dept": "SHS"},
        {"code": "ICT-EMPTECH", "title": "Empowerment Technologies", "subj": "Empowerment Technologies", "g_level": "Grade 11", "e_level": "Senior High School", "strand": "STEM", "teacher": "teacher.ict", "section": "Grade 11 STEM - Newton", "dept": "ICT"}
    ]

    courses = []
    for c in course_data:
        term = "Term 1"
        course_obj = get_or_create_course(
            session, code=f"{c['code']}-{term.replace('Term ', 'T')}", title=c['title'], 
            subject=c['subj'], education_level=c['e_level'], grade_level=c['g_level'], 
            strand=c['strand'], term=term, school_year="2026-2027", 
            teacher_id=teachers[c['teacher']].id, department_id=depts[c['dept']].id
        )
        courses.append((course_obj, c['section']))

    # Enroll students
    for st, section_obj in students:
        for course_obj, course_section in courses:
            if section_obj.name == course_section:
                get_or_create_enrollment(session, course_id=course_obj.id, student_id=st.id)

    # 6. Create Modules
    module_templates = {
        "Mathematics": [
            ("Integers and Real-Life Applications", "M7-Q1-W1", "Operations on rational numbers"),
            ("Linear Equations in One Variable", "M7-Q1-W2", "Solving linear equations"),
            ("Introduction to Polynomials", "M7-Q2-W1", "Polynomial operations")
        ],
        "Science": [
            ("Scientific Method and Laboratory Safety", "S8-Q1-W1", "Apply scientific method"),
            ("Cell Structure and Function", "S8-Q2-W1", "Differentiate plant and animal cells"),
            ("Ecosystems and Biodiversity", "S8-Q3-W1", "Explain energy transfer in ecosystems")
        ],
        "English": [
            ("Identifying Main Ideas", "EN9-Q1-W1", "Identify main ideas and supporting details"),
            ("Writing Coherent Paragraphs", "EN9-Q1-W2", "Write well-structured paragraphs"),
            ("Elements of Short Stories", "EN9-Q2-W1", "Analyze plot, character, and setting")
        ],
        "Araling Panlipunan": [
            ("Heograpiya ng Asya", "AP10-Q1-W1", "Katangiang pisikal ng Asya"),
            ("Sinaunang Kabihasnan sa Asya", "AP10-Q1-W2", "Pag-usbong ng kabihasnan"),
            ("Kolonyalismo at Imperyalismo", "AP10-Q2-W1", "Epekto ng kolonyalismo")
        ],
        "Pre-Calculus": [
            ("Conic Sections", "STEM-PC11-Q1-W1", "Graphing conic sections"),
            ("Systems of Nonlinear Equations", "STEM-PC11-Q1-W2", "Solving nonlinear systems"),
            ("Trigonometric Identities", "STEM-PC11-Q2-W1", "Proving trig identities")
        ]
    }

    # Default fallback for other subjects
    default_modules = [
        ("Introduction to the Subject", "MELC-1", "Understand basics"),
        ("Core Concepts and Theories", "MELC-2", "Apply core concepts"),
        ("Practical Applications", "MELC-3", "Demonstrate mastery")
    ]

    for course_obj, _ in courses:
        mods = module_templates.get(course_obj.title, default_modules)
        for i, (m_title, m_code, m_comp) in enumerate(mods, 1):
            exists = session.scalar(select(Module).where(Module.course_id == course_obj.id, Module.title == m_title))
            if not exists:
                mod = Module(
                    course_id=course_obj.id, melc_code=m_code, learning_competency=m_comp,
                    lesson_objectives=f"Objective 1, Objective 2 for {m_title}",
                    assessment_type="Written Work", grade_level=course_obj.grade_level,
                    subject=course_obj.subject, term=course_obj.term, week=i,
                    sequence_order=i, folder_name=m_title.replace(" ", "_"),
                    title=m_title, summary=f"Summary of {m_title}",
                    essential_question=f"Why is {m_title} important?",
                    content=f"# {m_title}\n\nThis is the main content paragraph for {m_title}. It covers the essential concepts required by DepEd for this level."
                )
                session.add(mod)

    session.flush()

    # 7. Announcements
    for course_obj, _ in courses:
        titles = [
            ("Welcome to the Class!", f"Welcome to {course_obj.title}. I am excited to be your teacher this term."),
            ("Reminder: Check Module 1", "Please make sure to read the first module before our synchronous session."),
            ("Upcoming Quiz", "Prepare for our first quiz next week. Review the materials.")
        ]
        for title, body in titles:
            exists = session.scalar(select(StreamPost).where(StreamPost.course_id == course_obj.id, StreamPost.title == title))
            if not exists:
                session.add(StreamPost(course_id=course_obj.id, author_id=course_obj.teacher_id, title=title, body=body, post_type="announcement"))

    # 8. Assignments and Quizzes
    for course_obj, _ in courses:
        # Assignments
        exists_assgn = session.scalar(select(Assignment).where(Assignment.course_id == course_obj.id))
        if not exists_assgn:
            a1 = Assignment(course_id=course_obj.id, title="Reflection Paper 1", instructions="Write a short reflection on what we discussed.", points=20, assignment_type="written_response", created_by=course_obj.teacher_id)
            a2 = Assignment(course_id=course_obj.id, title="Module 1 Worksheet", instructions="Download and submit the completed worksheet.", points=50, assignment_type="file_submission", created_by=course_obj.teacher_id)
            session.add_all([a1, a2])
            session.flush()
            
            # Quizzes
            q = Quiz(course_id=course_obj.id, title=f"Quiz 1: {course_obj.title} Basics", instructions="Choose the best answer.", created_by=course_obj.teacher_id, is_published=True)
            session.add(q)
            session.flush()
            
            for i in range(1, 6):
                qq = QuizQuestion(quiz_id=q.id, question_text=f"Question {i} for {course_obj.subject}", choices_json='["Option A", "Option B", "Option C", "Option D"]', answer_key="Option A", points=1)
                session.add(qq)

    session.flush()

    # 9. Submissions, Grades, and Quiz Attempts
    # We will simulate for the first 5 students in each course
    all_quizzes = session.scalars(select(Quiz)).all()
    all_assignments = session.scalars(select(Assignment)).all()
    
    for course_obj, course_section in courses:
        enrolled_students = [st for st, s_obj in students if s_obj.name == course_section]
        
        for st in enrolled_students[:5]: # just the first few for demo data
            # Grades
            for comp in ["Written Works", "Performance Tasks", "Quarterly Assessment"]:
                exists_g = session.scalar(select(GradeEntry).where(GradeEntry.student_id == st.id, GradeEntry.course_id == course_obj.id, GradeEntry.component == comp))
                if not exists_g:
                    score = random.uniform(75, 98)
                    session.add(GradeEntry(student_id=st.id, course_id=course_obj.id, term=course_obj.term, component=comp, score=score, max_score=100, weight=0.33, recorded_by=course_obj.teacher_id, remarks="Good job"))
            
            # Submissions
            for a in [a for a in all_assignments if a.course_id == course_obj.id]:
                exists_sub = session.scalar(select(Submission).where(Submission.assignment_id == a.id, Submission.student_id == st.id))
                if not exists_sub:
                    sub = Submission(assignment_id=a.id, student_id=st.id, response_text="Here is my answer.", status="graded", score=random.uniform(0.7, 1.0)*a.points, feedback="Well done.")
                    session.add(sub)
            
            # Quiz Attempts
            for q in [q for q in all_quizzes if q.course_id == course_obj.id]:
                exists_qa = session.scalar(select(QuizAttempt).where(QuizAttempt.quiz_id == q.id, QuizAttempt.student_id == st.id))
                if not exists_qa:
                    qa = QuizAttempt(quiz_id=q.id, student_id=st.id, answers_json='{"1": "Option A", "2": "Option B"}', score=random.randint(3, 5), submitted_at=func.now())
                    session.add(qa)
                    
    session.flush()

    # 10. AI / Tutor Demo Data
    first_student = students[0][0]
    first_course = courses[0][0]
    
    exists_ai = session.scalar(select(AIConversation).where(AIConversation.student_id == first_student.id))
    if not exists_ai:
        session.add(AIConversation(student_id=first_student.id, course_id=first_course.id, prompt="Can you explain fractions?", response="Fractions represent a part of a whole. Think of a pizza cut into 8 slices..."))
        session.add(AIConversation(student_id=first_student.id, course_id=first_course.id, prompt="Ano ang photosynthesis?", response="Ang photosynthesis ay ang proseso kung saan ang mga halaman ay gumagawa ng kanilang sariling pagkain gamit ang sikat ng araw..."))
        
        prof = StudentAIProfile(
            student_id=first_student.id,
            strengths_json='[{"topic": "Basic Math", "average": 90, "evidenceCount": 4}]',
            weak_concepts_json='[{"topic": "Fractions", "average": 70, "evidenceCount": 2}]',
            recommendations_json='["Practice more fraction word problems."]',
            ai_interaction_count=2
        )
        session.add(prof)
        
        # Chat Session
        cs = ChatSession(user_id=first_student.id, title="Help with Math")
        session.add(cs)
        session.flush()
        
        session.add(ChatMessage(session_id=cs.id, role="user", content="I need help with my Math assignment."))
        session.add(ChatMessage(session_id=cs.id, role="assistant", content="Of course! What specific topic in Math are you working on?"))

    session.commit()
