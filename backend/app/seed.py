import json
from sqlalchemy import func, select, delete
from sqlalchemy.orm import Session

from .models import User, Course, Module, StreamPost, Enrollment, GradeEntry, Assignment, AssignmentQuestion, Submission, Section
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


def wipe_old_mock_data(session: Session):
    # Wipe old Grade 10 demo courses explicitly
    course_codes = ["SCI-10-DEMO", "MATH-10", "ENG-10"]
    courses = session.scalars(select(Course).where(Course.code.in_(course_codes))).all()
    c_ids = [c.id for c in courses]
    
    if c_ids:
        # Delete cascades
        session.execute(delete(AssignmentQuestion).where(AssignmentQuestion.assignment_id.in_(
            select(Assignment.id).where(Assignment.course_id.in_(c_ids))
        )))
        session.execute(delete(Submission).where(Submission.assignment_id.in_(
            select(Assignment.id).where(Assignment.course_id.in_(c_ids))
        )))
        session.execute(delete(Assignment).where(Assignment.course_id.in_(c_ids)))
        session.execute(delete(GradeEntry).where(GradeEntry.course_id.in_(c_ids)))
        session.execute(delete(StreamPost).where(StreamPost.course_id.in_(c_ids)))
        session.execute(delete(Module).where(Module.course_id.in_(c_ids)))
        session.execute(delete(Enrollment).where(Enrollment.course_id.in_(c_ids)))
        session.execute(delete(Course).where(Course.id.in_(c_ids)))
        session.commit()
        
    # Also delete old Rizal and Mabini sections
    old_sections = session.scalars(select(Section).where(Section.name.in_(["Rizal", "Mabini"]))).all()
    if old_sections:
        for sec in old_sections:
            session.delete(sec)
        session.commit()


def seed_defaults(
    session: Session,
    *,
    admin_username: str,
    admin_password: str,
    portal_domain: str,
) -> None:
    wipe_old_mock_data(session)

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

    # Generate Realistic Grade 12 STEM Demo Accounts
    teacher = get_or_create_user(
        session,
        role="teacher",
        username="teacher1",
        email=f"teacher1@{clean_portal_domain}",
        full_name="Prof. Alejandro Mendoza",
        password=clean_password,
    )
    
    # Generate Sections
    sections_to_seed = [
        {"name": "Grade 7A", "grade_level": "Grade 7", "education_level": "Junior High School", "strand": None},
        {"name": "Grade 7B", "grade_level": "Grade 7", "education_level": "Junior High School", "strand": None},
        {"name": "STEM 11A", "grade_level": "Grade 11", "education_level": "Senior High School", "strand": "STEM"},
        {"name": "STEM 11B", "grade_level": "Grade 11", "education_level": "Senior High School", "strand": "STEM"},
        {"name": "STEM 12A", "grade_level": "Grade 12", "education_level": "Senior High School", "strand": "STEM"},
    ]
    for sdata in sections_to_seed:
        sec = session.scalar(select(Section).where(Section.name == sdata["name"]))
        if not sec:
            sec = Section(name=sdata["name"], grade_level=sdata["grade_level"], education_level=sdata["education_level"], strand=sdata["strand"], school_year="2026-2027", is_active=True)
            session.add(sec)
    session.flush()

    # Generate Students
    students_data = [
        ("student1", "Juan Dela Cruz"),
        ("student2", "Maria Clara"),
        ("student3", "Carlos Yulo"),
        ("student4", "EJ Obiena"),
        ("student5", "Hidilyn Diaz"),
        ("student6", "Alex Eala"),
        ("student7", "Manny Pacquiao"),
        ("student8", "Pia Wurtzbach"),
        ("student9", "Catriona Gray"),
        ("student10", "Lea Salonga")
    ]
    
    stem_students = []
    for uname, fname in students_data:
        stem_students.append(get_or_create_user(
            session, role="student", username=uname, email=f"{uname}@{clean_portal_domain}",
            full_name=fname, password=clean_password, grade_level="Grade 12", section_name="STEM 12A"
        ))

    # Generate Grade 12 STEM Courses
    calc_course = session.scalar(select(Course).where(Course.code == "CALC-12"))
    if not calc_course:
        calc_course = Course(
            code="CALC-12", title="Basic Calculus", subject="Mathematics", 
            education_level="Senior High School", grade_level="Grade 12", strand="STEM", term="Term 1", 
            school_year="2026-2027", description="Limits, Continuity, Derivatives, and Integration.", 
            teacher_id=teacher.id, is_active=True
        )
        session.add(calc_course)
        
    chem_course = session.scalar(select(Course).where(Course.code == "CHEM-12"))
    if not chem_course:
        chem_course = Course(
            code="CHEM-12", title="General Chemistry 2", subject="Science", 
            education_level="Senior High School", grade_level="Grade 12", strand="STEM", term="Term 2", 
            school_year="2026-2027", description="Thermodynamics, Chemical Kinetics, and Chemical Equilibrium.", 
            teacher_id=teacher.id, is_active=True
        )
        session.add(chem_course)
        
    res_course = session.scalar(select(Course).where(Course.code == "RES-12"))
    if not res_course:
        res_course = Course(
            code="RES-12", title="Practical Research 2", subject="Practical Research", 
            education_level="Senior High School", grade_level="Grade 12", strand="STEM", term="Term 3", 
            school_year="2026-2027", description="Quantitative Research Methodology and Statistical Analysis.", 
            teacher_id=teacher.id, is_active=True
        )
        session.add(res_course)

    session.flush()

    # Enroll Students
    for st in stem_students:
        for crs in [calc_course, chem_course, res_course]:
            if not session.scalar(select(Enrollment).where(Enrollment.course_id == crs.id, Enrollment.student_id == st.id)):
                session.add(Enrollment(course_id=crs.id, student_id=st.id))

    # Announcements
    for crs in [calc_course, chem_course, res_course]:
        if not session.scalar(select(StreamPost).where(StreamPost.course_id == crs.id, StreamPost.post_type == "announcement")):
            session.add(StreamPost(
                course_id=crs.id, author_id=teacher.id, title=f"Welcome to {crs.title}", 
                body="Please prepare for our Term Assessment. Make sure you have reviewed our previous modules.", post_type="announcement"
            ))

    session.flush()

    # Seed Assessments
    def create_assessment(course, title, questions_data):
        assign = session.scalar(select(Assignment).where(Assignment.course_id == course.id, Assignment.title == title))
        if not assign:
            assign = Assignment(
                course_id=course.id, title=title, instructions="Please answer all sections carefully.",
                points=len(questions_data), assignment_type="quiz", attachments_json="[]", created_by=teacher.id
            )
            session.add(assign)
            session.flush()
            for q in questions_data:
                session.add(AssignmentQuestion(
                    assignment_id=assign.id, section_name=q["section"], question_text=q["question"],
                    question_type="multiple_choice", choices_json=json.dumps(q["choices"]), answer_key=q["answer"], points=1
                ))
            
            # Post to stream
            session.add(StreamPost(course_id=course.id, author_id=teacher.id, title=title, body="Term Assessment is now available.", post_type='assignment'))
            
            # Submit for one student to demonstrate auto-grading
            st1 = stem_students[0]
            answers = {str(i): q["answer"] for i, q in enumerate(questions_data)}  # mock keys
            sub = Submission(assignment_id=assign.id, student_id=st1.id, status="graded", score=len(questions_data), answers_json=json.dumps(answers), attachments_json="[]")
            session.add(sub)
            session.add(GradeEntry(
                student_id=st1.id, course_id=course.id, term=course.term, component=f"Assignment: {title}",
                score=len(questions_data), max_score=len(questions_data), weight=1.0, recorded_by=teacher.id
            ))

    # Calculus Questions
    calc_questions = [
        # Section 1
        {"section": "Section 1: Limits", "question": "Evaluate the limit of (x^2 - 4)/(x - 2) as x approaches 2.", "choices": ["0", "2", "4", "Undefined"], "answer": "4"},
        {"section": "Section 1: Limits", "question": "What is the limit of sin(x)/x as x approaches 0?", "choices": ["0", "1", "Infinity", "Undefined"], "answer": "1"},
        {"section": "Section 1: Limits", "question": "If lim f(x)=3 and lim g(x)=4, what is lim [f(x)g(x)]?", "choices": ["7", "1", "12", "None"], "answer": "12"},
        {"section": "Section 1: Limits", "question": "Evaluate lim (1/x) as x approaches infinity.", "choices": ["0", "1", "Infinity", "Negative Infinity"], "answer": "0"},
        {"section": "Section 1: Limits", "question": "A function is continuous at x=c if and only if:", "choices": ["Limit exists", "f(c) is defined", "Limit equals f(c)", "All of the above"], "answer": "All of the above"},
        # Section 2
        {"section": "Section 2: Derivatives", "question": "What is the derivative of f(x) = 3x^4?", "choices": ["12x^3", "7x^3", "12x^4", "4x^3"], "answer": "12x^3"},
        {"section": "Section 2: Derivatives", "question": "Find the derivative of sin(x).", "choices": ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"], "answer": "cos(x)"},
        {"section": "Section 2: Derivatives", "question": "Apply the product rule for d/dx [u(x)v(x)].", "choices": ["u'v'", "uv' + vu'", "u'v - uv'", "uv"], "answer": "uv' + vu'"},
        {"section": "Section 2: Derivatives", "question": "What is the derivative of e^x?", "choices": ["xe^{x-1}", "e^x", "ln(x)", "1/x"], "answer": "e^x"},
        {"section": "Section 2: Derivatives", "question": "The derivative represents the:", "choices": ["Area under the curve", "Slope of the tangent line", "Y-intercept", "Roots of the function"], "answer": "Slope of the tangent line"},
        # Section 3
        {"section": "Section 3: Applications", "question": "A critical point occurs when the first derivative is:", "choices": ["1", "0 or undefined", "Positive", "Negative"], "answer": "0 or undefined"},
        {"section": "Section 3: Applications", "question": "To find the maximum of a function, the second derivative must be:", "choices": ["Positive", "Negative", "Zero", "Undefined"], "answer": "Negative"},
        {"section": "Section 3: Applications", "question": "Velocity is the derivative of:", "choices": ["Acceleration", "Position", "Time", "Mass"], "answer": "Position"},
        {"section": "Section 3: Applications", "question": "Acceleration is the derivative of:", "choices": ["Position", "Velocity", "Jerk", "Force"], "answer": "Velocity"},
        {"section": "Section 3: Applications", "question": "L'Hopital's Rule is used to evaluate limits of indeterminate forms such as:", "choices": ["0/0", "1/0", "0/1", "Infinity + Infinity"], "answer": "0/0"}
    ]
    create_assessment(calc_course, "Term 1 Assessment", calc_questions)

    # Chemistry Questions
    chem_questions = [
        # Section 1
        {"section": "Section 1: Chemical Equilibrium", "question": "Le Chatelier's Principle states that a system at equilibrium will shift to:", "choices": ["Increase pressure", "Produce more heat", "Counteract an applied stress", "Stop the reaction"], "answer": "Counteract an applied stress"},
        {"section": "Section 1: Chemical Equilibrium", "question": "For aA + bB <-> cC + dD, the equilibrium constant Kc is:", "choices": ["[C]^c[D]^d / [A]^a[B]^b", "[A]^a[B]^b / [C]^c[D]^d", "[A][B]/[C][D]", "[C][D]/[A][B]"], "answer": "[C]^c[D]^d / [A]^a[B]^b"},
        {"section": "Section 1: Chemical Equilibrium", "question": "If Kc > 1, the equilibrium favors the:", "choices": ["Reactants", "Products", "Neither", "Depends on temperature"], "answer": "Products"},
        {"section": "Section 1: Chemical Equilibrium", "question": "Which factor does NOT affect the equilibrium constant (Kc)?", "choices": ["Temperature", "Pressure", "Concentration", "Catalyst"], "answer": "Catalyst"},
        {"section": "Section 1: Chemical Equilibrium", "question": "Adding a catalyst to a system at equilibrium:", "choices": ["Shifts to products", "Shifts to reactants", "Increases K", "Has no effect on equilibrium position"], "answer": "Has no effect on equilibrium position"},
        # Section 2
        {"section": "Section 2: Acids and Bases", "question": "According to Bronsted-Lowry, an acid is a:", "choices": ["Proton donor", "Proton acceptor", "Electron donor", "Electron acceptor"], "answer": "Proton donor"},
        {"section": "Section 2: Acids and Bases", "question": "The pH of a 0.01M HCl solution is:", "choices": ["1", "2", "12", "14"], "answer": "2"},
        {"section": "Section 2: Acids and Bases", "question": "Which of the following is a strong base?", "choices": ["NH3", "NaOH", "CH3COOH", "H2O"], "answer": "NaOH"},
        {"section": "Section 2: Acids and Bases", "question": "A buffer solution resists changes in:", "choices": ["Temperature", "Pressure", "pH", "Volume"], "answer": "pH"},
        {"section": "Section 2: Acids and Bases", "question": "What is the conjugate base of H2SO4?", "choices": ["SO4 2-", "HSO4 -", "H3O+", "OH-"], "answer": "HSO4 -"},
        # Section 3
        {"section": "Section 3: Reaction Rates", "question": "The rate of a chemical reaction generally increases with:", "choices": ["Decreased temperature", "Increased concentration", "Decreased surface area", "Removal of a catalyst"], "answer": "Increased concentration"},
        {"section": "Section 3: Reaction Rates", "question": "Activation energy is the:", "choices": ["Energy released", "Minimum energy required to start a reaction", "Energy of products", "Kinetic energy of molecules"], "answer": "Minimum energy required to start a reaction"},
        {"section": "Section 3: Reaction Rates", "question": "A reaction with a negative delta H is:", "choices": ["Endothermic", "Exothermic", "Isothermal", "Catalytic"], "answer": "Exothermic"},
        {"section": "Section 3: Reaction Rates", "question": "The unit of the rate constant (k) for a first-order reaction is:", "choices": ["M/s", "1/s", "1/(M s)", "1/(M^2 s)"], "answer": "1/s"},
        {"section": "Section 3: Reaction Rates", "question": "Which equation relates the rate constant to temperature?", "choices": ["Ideal Gas Law", "Arrhenius Equation", "Nernst Equation", "Henderson-Hasselbalch Equation"], "answer": "Arrhenius Equation"}
    ]
    create_assessment(chem_course, "Term 2 Assessment", chem_questions)

    # Practical Research Questions
    res_questions = [
        # Section 1
        {"section": "Section 1: Methodology", "question": "Which research design is used to establish cause-and-effect relationships?", "choices": ["Descriptive", "Correlational", "Experimental", "Historical"], "answer": "Experimental"},
        {"section": "Section 1: Methodology", "question": "Quantitative research relies heavily on:", "choices": ["Interviews", "Numerical data", "Observations", "Thematic analysis"], "answer": "Numerical data"},
        {"section": "Section 1: Methodology", "question": "The group in an experiment that does not receive the treatment is the:", "choices": ["Experimental group", "Control group", "Sample group", "Population"], "answer": "Control group"},
        {"section": "Section 1: Methodology", "question": "A statement predicting the relationship between variables is a:", "choices": ["Theory", "Hypothesis", "Conclusion", "Fact"], "answer": "Hypothesis"},
        {"section": "Section 1: Methodology", "question": "Variables that are manipulated by the researcher are called:", "choices": ["Dependent variables", "Independent variables", "Confounding variables", "Extraneous variables"], "answer": "Independent variables"},
        # Section 2
        {"section": "Section 2: Data Gathering", "question": "A Likert scale is commonly used in:", "choices": ["Observations", "Interviews", "Questionnaires", "Experiments"], "answer": "Questionnaires"},
        {"section": "Section 2: Data Gathering", "question": "The entire group from which a sample is drawn is the:", "choices": ["Stratum", "Cluster", "Population", "Cohort"], "answer": "Population"},
        {"section": "Section 2: Data Gathering", "question": "Which sampling technique ensures every member has an equal chance of being selected?", "choices": ["Convenience sampling", "Purposive sampling", "Simple random sampling", "Snowball sampling"], "answer": "Simple random sampling"},
        {"section": "Section 2: Data Gathering", "question": "Reliability refers to the:", "choices": ["Truthfulness of the data", "Consistency of the instrument", "Appropriateness of the sample", "Cost of the research"], "answer": "Consistency of the instrument"},
        {"section": "Section 2: Data Gathering", "question": "Validity ensures that the instrument measures:", "choices": ["What it is supposed to measure", "Consistently over time", "A large sample", "Numerical values"], "answer": "What it is supposed to measure"},
        # Section 3
        {"section": "Section 3: Analysis and Ethics", "question": "Which statistical test is used to compare the means of two groups?", "choices": ["Chi-square test", "ANOVA", "t-test", "Pearson r"], "answer": "t-test"},
        {"section": "Section 3: Analysis and Ethics", "question": "Plagiarism is:", "choices": ["Using a large sample size", "Citing sources properly", "Claiming someone else's work as your own", "Fabricating data"], "answer": "Claiming someone else's work as your own"},
        {"section": "Section 3: Analysis and Ethics", "question": "Informed consent involves:", "choices": ["Paying participants", "Explaining the study and getting voluntary agreement", "Forcing participation", "Hiding the true purpose"], "answer": "Explaining the study and getting voluntary agreement"},
        {"section": "Section 3: Analysis and Ethics", "question": "A p-value less than 0.05 indicates:", "choices": ["Statistical insignificance", "Statistical significance", "A flawed experiment", "High reliability"], "answer": "Statistical significance"},
        {"section": "Section 3: Analysis and Ethics", "question": "Protecting the identity of participants is known as:", "choices": ["Anonymity", "Reliability", "Validity", "Transparency"], "answer": "Anonymity"}
    ]
    create_assessment(res_course, "Term 3 Assessment", res_questions)

    session.commit()
