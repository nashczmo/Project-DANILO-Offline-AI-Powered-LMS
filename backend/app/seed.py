from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import User, Course, Module, StreamPost, Enrollment, GradeEntry
from app.core.security import hash_password, verify_password


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

    # Generate Realistic Demo Accounts for Beta Release
    teacher = get_or_create_user(
        session,
        role="teacher",
        username="teacher1",
        email=f"teacher1@{clean_portal_domain}",
        full_name="Prof. Maria Santos",
        password=clean_password,
    )
    student1 = get_or_create_user(
        session,
        role="student",
        username="student1",
        email=f"student1@{clean_portal_domain}",
        full_name="Juan Dela Cruz",
        password=clean_password,
        grade_level="Grade 10",
        section_name="Rizal"
    )
    student2 = get_or_create_user(
        session,
        role="student",
        username="student2",
        email=f"student2@{clean_portal_domain}",
        full_name="Maria Clara",
        password=clean_password,
        grade_level="Grade 10",
        section_name="Rizal"
    )

    # Generate Sections
    from .models import Section
    section1 = session.scalar(select(Section).where(Section.name == "Rizal"))
    if not section1:
        section1 = Section(name="Rizal", grade_level="Grade 10", education_level="Junior High School", school_year="2026-2027", is_active=True)
        session.add(section1)
    
    section2 = session.scalar(select(Section).where(Section.name == "Mabini"))
    if not section2:
        section2 = Section(name="Mabini", grade_level="Grade 10", education_level="Junior High School", school_year="2026-2027", is_active=True)
        session.add(section2)
    session.flush()

    # Generate More Students
    students_data = [
        ("student3", "Pedro Penduko", "Rizal"),
        ("student4", "Ana Macaraeg", "Rizal"),
        ("student5", "Jose Dimaculangan", "Mabini"),
        ("student6", "Luzviminda Cruz", "Mabini"),
        ("student7", "Andres Bonifacio", "Mabini"),
        ("student8", "Gabriela Silang", "Rizal"),
        ("student9", "Antonio Luna", "Rizal"),
        ("student10", "Melchora Aquino", "Mabini"),
        ("student11", "Emilio Aguinaldo", "Rizal"),
        ("student12", "Apolinario Mabini", "Mabini"),
        ("student13", "Gregoria de Jesus", "Rizal"),
        ("student14", "Marcelo H. del Pilar", "Mabini"),
        ("student15", "Teresa Magbanua", "Rizal"),
        ("student16", "Juan Luna", "Mabini"),
        ("student17", "Gomburza Burgos", "Rizal"),
        ("student18", "Diego Silang", "Mabini"),
        ("student19", "Lapu-Lapu", "Rizal"),
        ("student20", "Rajah Sulayman", "Mabini"),
    ]
    
    more_students = []
    for uname, fname, sec in students_data:
        more_students.append(get_or_create_user(
            session, role="student", username=uname, email=f"{uname}@{clean_portal_domain}",
            full_name=fname, password=clean_password, grade_level="Grade 10", section_name=sec
        ))

    # Generate Courses
    demo_course = session.scalar(select(Course).where(Course.code == "SCI-10-DEMO"))
    if not demo_course:
        demo_course = Course(
            code="SCI-10-DEMO",
            title="Science 10: Earth & Space",
            subject="Science",
            education_level="Junior High School",
            grade_level="Grade 10",
            quarter="Q1",
            school_year="2026-2027",
            description="An interactive exploration of Earth and Space science.",
            teacher_id=teacher.id,
            is_active=True
        )
        session.add(demo_course)
        
    math_course = session.scalar(select(Course).where(Course.code == "MATH-10"))
    if not math_course:
        math_course = Course(
            code="MATH-10", title="Mathematics 10", subject="Mathematics", 
            education_level="Junior High School", grade_level="Grade 10", quarter="Q1", 
            school_year="2026-2027", description="Algebra and Geometry", 
            teacher_id=teacher.id, is_active=True
        )
        session.add(math_course)
        
    eng_course = session.scalar(select(Course).where(Course.code == "ENG-10"))
    if not eng_course:
        eng_course = Course(
            code="ENG-10", title="English 10", subject="English", 
            education_level="Junior High School", grade_level="Grade 10", quarter="Q1", 
            school_year="2026-2027", description="Literature and Composition", 
            teacher_id=teacher.id, is_active=True
        )
        session.add(eng_course)

    session.flush()

    # Enroll Students
    all_students = [student1, student2] + more_students
    for st in all_students:
        for crs in [demo_course, math_course, eng_course]:
            if not session.scalar(select(Enrollment).where(Enrollment.course_id == crs.id, Enrollment.student_id == st.id)):
                session.add(Enrollment(course_id=crs.id, student_id=st.id))

    # Generate Modules
    if not session.scalar(select(Module).where(Module.course_id == demo_course.id)):
        session.add(Module(
            course_id=demo_course.id, melc_code="S10ES-Ia-j-3.6", grade_level="Grade 10", subject="Science", quarter="Q1", week=1, sequence_order=1, folder_name="Plate_Tectonics", title="Module 1: Plate Tectonics", summary="Understanding the movement of Earth's lithospheric plates.", essential_question="How do moving plates shape the Earth?", content="# Plate Tectonics\n\nThe lithosphere is divided into tectonic plates..."
        ))

    # Stream Posts
    if not session.scalar(select(StreamPost).where(StreamPost.course_id == demo_course.id)):
        session.add(StreamPost(
            course_id=demo_course.id, author_id=teacher.id, title="Welcome to Science 10!", body="Please check Module 1 to begin our discussion on Plate Tectonics. You can use the AI Tutor if you have any questions.", post_type="announcement"
        ))

    # Mock Grades
    for st in all_students:
        # Science (3 sections of 10 items)
        if not session.scalar(select(GradeEntry).where(GradeEntry.student_id == st.id, GradeEntry.course_id == demo_course.id)):
            session.add(GradeEntry(student_id=st.id, course_id=demo_course.id, quarter="Q1", component="Section 1: Earth Science", score=9, max_score=10, weight=0.33, recorded_by=teacher.id))
            session.add(GradeEntry(student_id=st.id, course_id=demo_course.id, quarter="Q1", component="Section 2: Biology", score=8, max_score=10, weight=0.33, recorded_by=teacher.id))
            session.add(GradeEntry(student_id=st.id, course_id=demo_course.id, quarter="Q1", component="Section 3: Physics", score=9, max_score=10, weight=0.34, recorded_by=teacher.id))
        
        # Math (3 sections of 10 items)
        if not session.scalar(select(GradeEntry).where(GradeEntry.student_id == st.id, GradeEntry.course_id == math_course.id)):
            if st.username in ["student3", "student4", "student9"]:
                session.add(GradeEntry(student_id=st.id, course_id=math_course.id, quarter="Q1", component="Section 1: Algebra", score=3, max_score=10, weight=0.33, recorded_by=teacher.id, remarks="Struggling with Algebra concepts"))
            else:
                session.add(GradeEntry(student_id=st.id, course_id=math_course.id, quarter="Q1", component="Section 1: Algebra", score=8, max_score=10, weight=0.33, recorded_by=teacher.id))
            
            session.add(GradeEntry(student_id=st.id, course_id=math_course.id, quarter="Q1", component="Section 2: Geometry", score=8, max_score=10, weight=0.33, recorded_by=teacher.id))
            session.add(GradeEntry(student_id=st.id, course_id=math_course.id, quarter="Q1", component="Section 3: Statistics", score=9, max_score=10, weight=0.34, recorded_by=teacher.id))

        # English (3 sections of 10 items)
        if not session.scalar(select(GradeEntry).where(GradeEntry.student_id == st.id, GradeEntry.course_id == eng_course.id)):
            # Section 1: Reading Comprehension (10 items)
            if st.username in ["student5", "student11", "student15"]:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 1: Reading Comprehension", score=3, max_score=10, weight=0.33, recorded_by=teacher.id, remarks="Failed reading comprehension quiz"))
            else:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 1: Reading Comprehension", score=8, max_score=10, weight=0.33, recorded_by=teacher.id))

            # Section 2: Vocabulary Context (10 items)
            if st.username in ["student6", "student12", "student16"]:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 2: Vocabulary Context", score=4, max_score=10, weight=0.33, recorded_by=teacher.id, remarks="Failed vocabulary section"))
            else:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 2: Vocabulary Context", score=9, max_score=10, weight=0.33, recorded_by=teacher.id))

            # Section 3: Literary Analysis (10 items)
            if st.username in ["student7", "student13", "student17"]:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 3: Literary Analysis", score=2, max_score=10, weight=0.34, recorded_by=teacher.id, remarks="Failed literary analysis section"))
            else:
                session.add(GradeEntry(student_id=st.id, course_id=eng_course.id, quarter="Q1", component="Section 3: Literary Analysis", score=9, max_score=10, weight=0.34, recorded_by=teacher.id))

    session.commit()
